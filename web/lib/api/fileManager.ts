import { promises } from "fs"
import { getWorkerById } from "lib/data/workers"

import crypto from "crypto"
import path from "path"

export const generateFileName = (length: number): string => {
  return crypto.randomBytes(length).toString('hex') 
}

export const deleteOriginalImage = async (
  oldPhotoPath: string | undefined,
  newPhotoPath: string
) => {
  if(oldPhotoPath && oldPhotoPath !== newPhotoPath) { // if original image exists and it is named differently (meaning it wasn't replaced already by parseFormWithSingleImage) delete it 
    await promises.unlink(oldPhotoPath) // delete replaced/original image
  }
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
