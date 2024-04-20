import prisma from 'lib/prisma/connection'
import { cache_getActiveSummerJobEventId } from './cache'
import { NoActiveEventError } from './internal-error'
import { PhotoPathData } from 'lib/types/photo'
import { PrismaClient } from '@prisma/client'
import { PrismaTransactionClient } from 'lib/types/prisma'

export async function getPhotoById(id: string): Promise<PhotoPathData | null> {
  const activeEventId = await cache_getActiveSummerJobEventId()
  if (!activeEventId) {
    throw new NoActiveEventError()
  }
  const photo = await prisma.jobPhoto.findUnique({
    where: {
      id: id,
    },
    select: {
      photoPath: true,
    },
  })

  return photo
}

export async function createPhoto(data: PhotoPathData) {
  const activeEventId = await cache_getActiveSummerJobEventId()
  if (!activeEventId) {
    throw new NoActiveEventError()
  }
  const photo = await prisma.jobPhoto.create({
    data: data,
  })
  return photo
}

export async function updatePhoto(id: string, data: PhotoPathData) {
  const photo = await prisma.jobPhoto.update({
    where: {
      id: id,
    },
    data: data,
  })
  return photo
}

export async function deletePhotos(ids: string[]) {
  await prisma.$transaction(async tx => {
    for (const id of ids) {
      await deletePhoto(id, tx)
    }
  })
}

export async function deletePhoto(
  id: string,
  prismaClient: PrismaClient | PrismaTransactionClient = prisma
) {
  await prismaClient.jobPhoto.delete({
    where: {
      id,
    },
  })
}
