import { promises } from 'fs'
import crypto from 'crypto'
import path from 'path'
import { cache_getActiveSummerJobEventId } from 'lib/data/cache'
import { NoActiveEventError } from 'lib/data/internal-error'

export const getWorkersUploadDir = async () => {
  const uploadDir = await getUploadDirForImagesForCurrentEvent()
  return path.join(uploadDir, '/workers')
}

export const getApplicationsUploadDir = async () => {
  const uploadDir = await getUploadDirForImages()
  return path.join(uploadDir, '/applications')
}

export const getProposedJobsUploadDir = async () => {
  const uploadDir = await getUploadDirForImagesForCurrentEvent()
  return path.join(uploadDir, '/proposed-jobs')
}

export const getPostsUploadDir = async () => {
  const uploadDir = await getUploadDirForImagesForCurrentEvent()
  return path.join(uploadDir, '/posts')
}

export const getUploadDirForImagesForCurrentEvent = async () => {
  const activeEventId = await cache_getActiveSummerJobEventId()
  if (activeEventId === undefined) {
    throw new NoActiveEventError()
  }
  return path.join(getUploadDirForImages(), activeEventId)
}

export const getUploadDirForImages = (): string => {
  return path.resolve(`../${process.env.UPLOAD_DIR || '/web-storage'}`)
}

export const generateFileName = (length: number): string => {
  return crypto.randomBytes(length).toString('hex')
}

export const deleteFile = async (oldPhotoPath: string) => {
  await promises.unlink(oldPhotoPath) // delete replaced/original file
}

export const renameFile = async (
  oldPhotoPath: string,
  newPhotoPath: string
) => {
  await promises.rename(oldPhotoPath, newPhotoPath)
}

export const updatePhotoPathByNewFilename = (
  originalPath: string,
  newFilename: string,
  lastDirectory?: string
): string => {
  const type = path.extname(originalPath)
  const directories = path.dirname(originalPath)
  return path.join(directories, lastDirectory ?? '', newFilename + type)
}

export const createDirectory = async (dirName: string) => {
  try {
    await promises.access(dirName)
  } catch {
    await promises.mkdir(dirName, { recursive: true })
  }
}

export const deleteDirectory = async (dirName: string) => {
  try {
    await promises.access(dirName)
    await promises.rmdir(dirName)
  } catch {}
}
