import formidable from "formidable"
import { getPhotoPath } from "./parse-form"
import { createPhoto, updatePhoto } from "lib/data/photo"
import { updatePhotoPathByNewFilename, renameFile } from "./fileManager"

export const registerPhotos = async (files: formidable.Files): Promise<string[]> => {
  const newPhotoIds: string[] = []
  // Go through every file in files
  const fileFieldNames = Object.keys(files)
  fileFieldNames.forEach(async fieldName => { 
    const file = files[fieldName]
    const photoPath = getPhotoPath(file)
    const photo = {photoPath: photoPath}
    // create new photo
    const newPhoto = await createPhoto(photo)
    // save its id to photoIds array
    newPhotoIds.push(newPhoto.id)
    // rename photo to its id instead of temporary name which was proposedJob.id-number given in parseFormWithImages
    const newPhotoPath = updatePhotoPathByNewFilename(photoPath, newPhoto.id) ?? ''
    renameFile(photoPath, newPhotoPath)
    await updatePhoto(newPhoto.id, {photoPath: newPhotoPath})
  })
  return newPhotoIds
}