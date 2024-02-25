import { APIAccessController } from 'lib/api/APIAccessControler'
import { APIMethodHandler } from 'lib/api/MethodHandler'
import { getUploadDirForImages, renameFile, updatePhotoPathByNewFilename } from 'lib/api/fileManager'
import { getPhotoPath, parseForm, parseFormWithImages } from 'lib/api/parse-form'
import { registerPhotos } from 'lib/api/registerPhotos'
import { validateOrSendError } from 'lib/api/validator'
import { createPhoto, updatePhoto } from 'lib/data/photo'
import {
  deleteProposedJob,
  getProposedJobById,
  updateProposedJob,
} from 'lib/data/proposed-jobs'
import logger from 'lib/logger/logger'
import { ExtendedSession, Permission } from 'lib/types/auth'
import { APILogEvent } from 'lib/types/logger'
import { PhotoPathSchema, PhotoPathSchemaTest } from 'lib/types/photo'
import {
  ProposedJobUpdateSchema,
  ProposedJobUpdateDataInput,
} from 'lib/types/proposed-job'
import { NextApiRequest, NextApiResponse } from 'next'

async function get(
  req: NextApiRequest,
  res: NextApiResponse,
  session: ExtendedSession
) {
  const id = req.query.id as string
  const job = await getProposedJobById(id)
  if (!job) {
    res.status(404).end()
    return
  }
  res.status(200).json(job)
}

export type ProposedJobAPIPatchData = ProposedJobUpdateDataInput
async function patch(
  req: NextApiRequest,
  res: NextApiResponse,
  session: ExtendedSession
) {
  const id = req.query.id as string
  const { files, json } = await parseFormWithImages(req, id, getUploadDirForImages() + `/proposed-job/${id}`, 10)
  const proposedJobData = validateOrSendError(
    ProposedJobUpdateSchema,
    json,
    res
  )
  if (!proposedJobData) {
    return
  }

  /*
  // Go through every file in files
  const fileFieldNames = Object.keys(files)
  fileFieldNames.forEach(async fieldName => { 
    const file = files[fieldName]
    const photoPath = getPhotoPath(file)
    const photo = validateOrSendError(PhotoPathSchemaTest, {photoPath: photoPath}, res)
    if(!photo) {
      return
    }
    // create new photo
    const newPhoto = await createPhoto(photo)
    // save its id to photoIds array for proposedJob
    if(!proposedJobData.photoIds) {
      proposedJobData.photoIds = [newPhoto.id]
    }
    else {
      proposedJobData.photoIds.push(newPhoto.id)
    }
    // rename photo to its id instead of temporary name which was proposedJob.id-number given in parseFormWithImages
    const newPhotoPath = updatePhotoPathByNewFilename(photoPath, newPhoto.id) ?? ''
    renameFile(photoPath, newPhotoPath)
    await updatePhoto(newPhoto.id, {photoPath: newPhotoPath})
  })
  */
  const newPhotoIds = await registerPhotos(files)
  proposedJobData.photoIds ? proposedJobData.photoIds.concat(newPhotoIds) : proposedJobData.photoIds = newPhotoIds

  await logger.apiRequest(APILogEvent.JOB_MODIFY, id, proposedJobData, session)
  await updateProposedJob(id, proposedJobData)
  res.status(204).end()
}

async function del(
  req: NextApiRequest,
  res: NextApiResponse,
  session: ExtendedSession
) {
  const id = req.query.id as string
  await logger.apiRequest(APILogEvent.JOB_DELETE, id, {}, session)
  await deleteProposedJob(id)
  res.status(204).end()
}

export default APIAccessController(
  [Permission.JOBS],
  APIMethodHandler({ get, patch, del })
)

export const config = {
  api: {
    bodyParser: false
  }
}