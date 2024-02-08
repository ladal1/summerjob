import { promises } from "fs"
import crypto from "crypto"
import path from "path"

export const generateFileName = (length: number): string => {
  return crypto.randomBytes(length).toString('hex') 
}

export const deleteFile = async (
  oldPhotoPath: string
) => {
  await promises.unlink(oldPhotoPath) // delete replaced/original file
} 

export const renameFile = async (
  oldPhotoPath: string,
  newPhotoPath: string
) => {
  await promises.rename(oldPhotoPath, newPhotoPath)
} 

export const getUploadDirForImages = (
): string => {
  return path.resolve(process.cwd() + '/../') + (process.env.UPLOAD_DIR || '/web-storage')
}

export const updatePhotoPathByNewFilename = (
  originalPath: string,
  newFilename: string
): string | undefined => {
  const lastSlashIndex = originalPath.lastIndexOf('/')
  const lastDotIndex = originalPath.lastIndexOf('.')

  // check if both chars / . were found
  if (lastSlashIndex === -1 || lastDotIndex === -1) {
    return ''
  }

  // get part before and after replaced part
  const directory = originalPath.slice(0, lastSlashIndex + 1) // directory part
  const fileType = originalPath.slice(lastDotIndex) // type part

  // create new path
  return `${directory}${newFilename}${fileType}`
} 