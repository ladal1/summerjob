import formidable from "formidable"
import { getPhotoPath } from "../parse-form"
import { createPhoto, deletePhotos, getPhotoById, updatePhoto } from "lib/data/photo"
import { updatePhotoPathByNewFilename, renameFile, deleteFile, createDirectory } from "../fileManager"
import logger from "lib/logger/logger"
import { APILogEvent } from "lib/types/logger"
import { ExtendedSession } from "lib/types/auth"
import { PhotoCompleteData } from "lib/types/photo"

const savePhotos = async (
  files: formidable.Files, 
  uploadDirectory: string,
  lastDirectory: string,
  session: ExtendedSession,
) => {
  const newPhotos: PhotoCompleteData[] = []
  // Go through every file in files
  const fileFieldNames = Object.keys(files)
  if(fileFieldNames.length !== 0) {
    // Create directory for photos
    await createDirectory(uploadDirectory + lastDirectory)
    for (const fieldName of fileFieldNames) {
      const file = files[fieldName]
      const photoPath = getPhotoPath(file)
      // create new photo
      const newPhoto = await createPhoto({photoPath: photoPath})
      // save its id to photoIds array
      newPhotos.push(newPhoto)
      // rename photo to its id instead of temporary name which was proposedJob.id-number given in parseFormWithImages
      const newPhotoPath = updatePhotoPathByNewFilename(photoPath, lastDirectory, newPhoto.id) ?? ''
      renameFile(photoPath, newPhotoPath)
      await updatePhoto(newPhoto.id, {photoPath: newPhotoPath})
    }
  }
  await logger.apiRequest(APILogEvent.PHOTO_CREATE, 'photos', newPhotos, session)
}

const deleteFlaggedPhotos = async (
  photoIdsDeleted: string[] | undefined,
  session: ExtendedSession,
) => {
  if(photoIdsDeleted) {
    // go through photos ids and see which are being deleted
    const photoIdsDeletedFinal: string[] = await Promise.all(
      photoIdsDeleted.map(async (photoId) => {
        const photo = await getPhotoById(photoId)
        if(photo) {
          deleteFile(photo.photoPath)
          return photoId
        }
      })
    ).then((result) => result.filter((photoId) => photoId !== undefined)) as string[]
    await logger.apiRequest(APILogEvent.PHOTO_DELETE, 'photos', photoIdsDeletedFinal, session)
    await deletePhotos(photoIdsDeletedFinal)
  }
}

export const registerPhotos = async (
  files: formidable.Files,
  photoIdsDeleted: string[] | undefined,
  uploadDirectory: string, 
  lastDirectory: string,
  session: ExtendedSession,
) => {
  await deleteFlaggedPhotos(photoIdsDeleted, session)
  await savePhotos(files, uploadDirectory, lastDirectory, session)
}