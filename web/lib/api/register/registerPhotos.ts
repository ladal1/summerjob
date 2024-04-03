import formidable from 'formidable'
import {
  createPhoto,
  deletePhotos,
  getPhotoById,
  updatePhoto,
} from 'lib/data/photo'
import { hasProposedJobPhotos } from 'lib/data/proposed-jobs'
import logger from 'lib/logger/logger'
import { ExtendedSession } from 'lib/types/auth'
import { APILogEvent } from 'lib/types/logger'
import { PhotoCompleteData } from 'lib/types/photo'
import {
  createDirectory,
  deleteDirectory,
  deleteFile,
  renameFile,
  updatePhotoPathByNewFilename,
} from '../fileManager'
import { getPhotoPath } from '../parse-form'

const savePhotos = async (
  files: formidable.Files,
  uploadDirectory: string,
  jobId: string,
  session: ExtendedSession
) => {
  const newPhotos: PhotoCompleteData[] = []
  // Go through every file in files
  const fileFieldNames = Object.keys(files)
  if (fileFieldNames.length !== 0) {
    // Create directory for photos
    await createDirectory(uploadDirectory + `/${jobId}`)
    for (const fieldName of fileFieldNames) {
      const file = files[fieldName]
      const photoPath = getPhotoPath(file)
      // create new photo
      const newPhoto = await createPhoto({
        photoPath: photoPath,
        proposedJobId: jobId,
      })
      // rename photo to its id instead of temporary name which was proposedJob.id-number given in parseFormWithImages
      const newPhotoPath =
        updatePhotoPathByNewFilename(photoPath, newPhoto.id, `/${jobId}`) ?? ''
      renameFile(photoPath, newPhotoPath)
      const renamedPhoto = await updatePhoto(newPhoto.id, {
        photoPath: newPhotoPath,
      })
      // save its id to photoIds array
      newPhotos.push(renamedPhoto)
    }
  }
  if (newPhotos.length !== 0)
    await logger.apiRequest(
      APILogEvent.PHOTO_CREATE,
      'photos',
      newPhotos,
      session
    )
}

const deleteFlaggedPhotos = async (
  photoIdsDeleted: string[] | undefined,
  session: ExtendedSession
) => {
  if (photoIdsDeleted) {
    // go through photos ids and see which are being deleted
    const photoIdsDeletedFinal: string[] = (await Promise.all(
      photoIdsDeleted.map(async photoId => {
        const photo = await getPhotoById(photoId)
        if (photo) {
          deleteFile(photo.photoPath)
          return photoId
        }
      })
    ).then(result =>
      result.filter(photoId => photoId !== undefined)
    )) as string[]
    if (photoIdsDeletedFinal.length !== 0) {
      await logger.apiRequest(
        APILogEvent.PHOTO_DELETE,
        'photos',
        photoIdsDeletedFinal,
        session
      )
      await deletePhotos(photoIdsDeletedFinal)
    }
  }
}

export const registerPhotos = async (
  files: formidable.Files,
  photoIdsDeleted: string[] | undefined,
  uploadDirectory: string,
  jobId: string,
  session: ExtendedSession
) => {
  await deleteFlaggedPhotos(photoIdsDeleted, session)
  await savePhotos(files, uploadDirectory, jobId, session)
  const hasAnyPhotos = await hasProposedJobPhotos(jobId)
  if (!hasAnyPhotos) {
    await deleteDirectory(uploadDirectory + '/' + jobId)
  }
}
