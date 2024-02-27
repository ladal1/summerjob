import prisma from 'lib/prisma/connection'
import { cache_getActiveSummerJobEventId } from './cache'
import { NoActiveEventError } from './internal-error'
import { PhotoPathData } from 'lib/types/photo'

export async function getPhotoById(
  id: string
): Promise<PhotoPathData | null> {
  const activeEventId = await cache_getActiveSummerJobEventId()
  if (!activeEventId) {
    throw new NoActiveEventError()
  }
  const photo = await prisma.photo.findUnique({
    where: {
      id: id,
    },
    select: {
      photoPath: true,
    },
  })
  
  return photo
}

export async function createPhoto(
  data: PhotoPathData,
) {
  const activeEventId = await cache_getActiveSummerJobEventId()
  if (!activeEventId) {
    throw new NoActiveEventError()
  }
  const photo = await prisma.photo.create({
    data: data,
  })
  return photo
}

export async function updatePhoto(
  id: string, 
  photo: PhotoPathData
) {
  await prisma.photo.update({
    where: {
      id: id,
    },
    data: {
      photoPath: photo.photoPath,
    },
  })
}

export async function deletePhoto(
  id: string
) {
  await prisma.photo.delete({
    where: {
      id,
    },
  })
}
