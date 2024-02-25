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
  // TODO: do model of photo in prisma
  /*const photo = await prisma.photo.findUnique({
    where: {
      id: id,
    },
    select: {
      photoPath: true,
    },
  })
  
  return photo*/
  return null
}