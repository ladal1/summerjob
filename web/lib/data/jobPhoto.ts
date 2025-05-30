import { PrismaClient } from '@prisma/client'
import formidable from 'formidable'
import {
  createDirectory,
  deleteDirectory,
  deleteFile,
  getUploadDirForImagesForCurrentEvent,
  renameFile,
  updatePhotoPathByNewFilename,
} from 'lib/api/fileManager'
import { getPhotoPath } from 'lib/api/parse-form'
import prisma from 'lib/prisma/connection'
import { PhotoCompleteData, PhotoPathData } from 'lib/types/photo'
import { PrismaTransactionClient } from 'lib/types/prisma'
import { cache_getActiveSummerJobEventId } from './cache'
import { NoActiveEventError } from './internal-error'
import {
  getProposedJobPhotoIdsById,
  hasProposedJobPhotos,
} from './proposed-jobs'
import path from 'path'

export async function getPhotoPathById(
  id: string,
  prismaClient: PrismaClient | PrismaTransactionClient = prisma
): Promise<string | null> {
  const activeEventId = await cache_getActiveSummerJobEventId()
  if (!activeEventId) {
    throw new NoActiveEventError()
  }
  const photo = await prismaClient.jobPhoto.findUnique({
    where: {
      id: id,
    },
    select: {
      photoPath: true,
    },
  })
  if (!photo || !photo.photoPath) {
    return null
  }
  // Save only relative part of photoPath
  const uploadDirAbsolutePath = await getUploadDirForImagesForCurrentEvent()
  return path.join(uploadDirAbsolutePath, photo.photoPath)
}

export async function createPhoto(
  data: PhotoPathData,
  prismaClient: PrismaClient | PrismaTransactionClient = prisma
) {
  const activeEventId = await cache_getActiveSummerJobEventId()
  if (!activeEventId) {
    throw new NoActiveEventError()
  }
  const photo = await prismaClient.jobPhoto.create({
    data: data,
  })
  return photo
}

export async function updatePhoto(
  id: string,
  data: PhotoPathData,
  prismaClient: PrismaClient | PrismaTransactionClient = prisma
) {
  const photo = await prismaClient.jobPhoto.update({
    where: {
      id: id,
    },
    data: data,
  })
  return photo
}

export async function deletePhotos(
  ids: string[],
  prismaClient: PrismaTransactionClient
) {
  for (const id of ids) {
    await deletePhoto(id, prismaClient)
  }
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

//#region register photos

const savePhotos = async (
  files: formidable.Files,
  uploadDirectory: string,
  jobId: string,
  prismaClient: PrismaClient | PrismaTransactionClient = prisma
) => {
  const newPhotos: PhotoCompleteData[] = []
  // Go through every file in files
  const fileFieldNames = Object.keys(files)
  if (fileFieldNames.length !== 0) {
    // Create directory for photos
    await createDirectory(path.join(uploadDirectory, `/proposed-jobs/${jobId}`))
    for (const fieldName of fileFieldNames) {
      const file = files[fieldName]
      if (!file) continue
      const photoPath = getPhotoPath(file)
      const relativePath = path.normalize(
        photoPath.substring(uploadDirectory.length)
      )
      // create new photo
      const newPhoto = await createPhoto(
        {
          photoPath: relativePath,
          proposedJobId: jobId,
        },
        prismaClient
      )
      // rename photo to its id instead of temporary name which was proposedJob.id-number given in parseFormWithImages
      const newPhotoPath =
        updatePhotoPathByNewFilename(photoPath, newPhoto.id, `/${jobId}`) ?? ''
      await renameFile(photoPath, newPhotoPath)
      // Save only relative part of photoPath
      const newRelativePath = path.normalize(
        newPhotoPath.substring(uploadDirectory.length)
      )
      const renamedPhoto = await updatePhoto(
        newPhoto.id,
        {
          photoPath: newRelativePath,
        },
        prismaClient
      )
      // save its id to photoIds array
      newPhotos.push(renamedPhoto)
    }
  }
}

const deleteManyPhotosFromDisk = async (
  photoIdsDeleted: string[] | undefined,
  prismaClient: PrismaClient | PrismaTransactionClient = prisma
) => {
  return await Promise.all(
    (photoIdsDeleted ?? []).map(async photoId => {
      const photo = await getPhotoPathById(photoId, prismaClient)
      if (photo) {
        await deleteFile(photo)
        return photoId
      }
    })
  ).then(result => result.filter(photoId => photoId !== undefined))
}

const deleteFlaggedPhotos = async (
  photoIdsDeleted: string[] | undefined,
  prismaClient: PrismaClient | PrismaTransactionClient = prisma
) => {
  if (photoIdsDeleted) {
    // go through photos ids and see which are being deleted
    const photoIdsDeletedFinal = await deleteManyPhotosFromDisk(photoIdsDeleted)
    if (photoIdsDeletedFinal && photoIdsDeletedFinal.length !== 0) {
      const photoIdsDel = photoIdsDeletedFinal.filter(
        id => id !== undefined
      ) as string[]
      await deletePhotos(photoIdsDel, prismaClient)
    }
  }
}

export const registerPhotos = async (
  files: formidable.Files,
  photoIdsDeleted: string[] | undefined,
  jobId: string,
  prismaClient: PrismaClient | PrismaTransactionClient = prisma
) => {
  const uploadDirectory = await getUploadDirForImagesForCurrentEvent()
  await deleteFlaggedPhotos(photoIdsDeleted, prismaClient)
  await savePhotos(files, uploadDirectory, jobId, prismaClient)
  const hasAnyPhotos = await hasProposedJobPhotos(jobId, prismaClient)
  if (!hasAnyPhotos) {
    await deleteDirectory(path.join(uploadDirectory, '/proposed-jobs/', jobId))
  }
}

export const deleteAllPhotos = async (
  jobId: string,
  prismaClient: PrismaClient | PrismaTransactionClient = prisma
) => {
  const photos = await getProposedJobPhotoIdsById(jobId, prismaClient)
  if (photos) {
    const photoIds = photos.photos.map(photo => photo.id)
    await deleteManyPhotosFromDisk(photoIds, prismaClient)
    await deletePhotos(photoIds, prismaClient)
  }
  const uploadDirectory = await getUploadDirForImagesForCurrentEvent()
  await deleteDirectory(path.join(uploadDirectory, '/proposed-jobs/', jobId))
}

//#endregion
