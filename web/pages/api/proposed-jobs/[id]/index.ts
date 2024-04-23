import { APIAccessController } from 'lib/api/APIAccessControler'
import { APIMethodHandler } from 'lib/api/MethodHandler'
import { getUploadDirForImagesForCurrentEvent } from 'lib/api/fileManager'
import { parseFormWithImages } from 'lib/api/parse-form'
import { validateOrSendError } from 'lib/api/validator'
import {
  deleteProposedJob,
  getProposedJobById,
  getProposedJobPhotoIdsById,
  updateProposedJob,
} from 'lib/data/proposed-jobs'
import logger from 'lib/logger/logger'
import { ExtendedSession, Permission } from 'lib/types/auth'
import { APILogEvent } from 'lib/types/logger'
import {
  ProposedJobUpdateDataInput,
  ProposedJobUpdateSchema,
} from 'lib/types/proposed-job'
import { NextApiRequest, NextApiResponse } from 'next'

async function get(req: NextApiRequest, res: NextApiResponse) {
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
  const job = await getProposedJobById(id)
  if (!job) {
    res.status(404).end()
    return
  }

  // Get current photoIds
  const currentPhotoIds = await getProposedJobPhotoIdsById(job.id)
  const currentPhotoCnt = currentPhotoIds?.photos.length ?? 0
  const uploadDirectory =
    (await getUploadDirForImagesForCurrentEvent()) + '/proposed-jobs'

  const { files, json } = await parseFormWithImages(
    req,
    res,
    job.id,
    uploadDirectory,
    10 - currentPhotoCnt
  )

  const proposedJobData = validateOrSendError(
    ProposedJobUpdateSchema,
    json,
    res
  )

  if (!proposedJobData) {
    return
  }

  await logger.apiRequest(
    APILogEvent.JOB_MODIFY,
    job.id,
    proposedJobData,
    session
  )
  await updateProposedJob(job.id, proposedJobData, files)
  res.status(204).end()
}

async function del(
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
  await logger.apiRequest(APILogEvent.JOB_DELETE, job.id, {}, session)
  await deleteProposedJob(job.id)
  res.status(204).end()
}

export default APIAccessController(
  [Permission.JOBS],
  APIMethodHandler({ get, patch, del })
)

export const config = {
  api: {
    bodyParser: false,
  },
}
