import { APIAccessController } from 'lib/api/APIAccessControler'
import { APIMethodHandler } from 'lib/api/MethodHandler'
import { deleteFile, getUploadDirForImages, renameFile, updatePhotoPathByNewFilename } from 'lib/api/fileManager'
import { getPhotoPath, parseForm, parseFormWithImages } from 'lib/api/parse-form'
import { registerPhotos } from 'lib/api/registerPhotos'
import { validateOrSendError } from 'lib/api/validator'
import { createPhoto, deletePhoto, getPhotoById, updatePhoto } from 'lib/data/photo'
import {
  deleteProposedJob,
  getProposedJobById,
  getProposedJobPhotoIdsById,
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
  
  // Get current photoIds
  const currentPhotoIds = await getProposedJobPhotoIdsById(id)
  const currentPhotoCnt = currentPhotoIds?.photoIds.length ?? 0

  const { files, json } = await parseFormWithImages(req, id, getUploadDirForImages() + `/proposed-job/${id}`, 10 - currentPhotoCnt)
  const proposedJobData = validateOrSendError(
    ProposedJobUpdateSchema,
    json,
    res
  )
  if (!proposedJobData) {
    return
  }

  // Save existing ids
  proposedJobData.photoIds = currentPhotoIds?.photoIds ?? []

  // Delete those photos by their ids, that are flaged to be deleted.
  if(proposedJobData.photoIdsDeleted) {
    for (const photoId of proposedJobData.photoIdsDeleted) {
      const photo = await getPhotoById(photoId)
      if(photo) {
        deleteFile(photo.photoPath)
        await deletePhoto(photoId)
        proposedJobData.photoIds = proposedJobData.photoIds?.filter((id) => id !== photoId)
      }
    }
  }

  // Save photo ids that belong to proposedJob
  const newPhotoIds = await registerPhotos(files)
  if(proposedJobData.photoIds) {
    proposedJobData.photoIds = proposedJobData.photoIds.concat(newPhotoIds)
  }
  else {
    proposedJobData.photoIds = newPhotoIds
  }

  await logger.apiRequest(APILogEvent.JOB_MODIFY, id, proposedJobData, session)
  const {photoIdsDeleted, ...rest} = proposedJobData
  await updateProposedJob(id, rest)
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