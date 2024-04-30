import { APIAccessController } from 'lib/api/APIAccessControler'
import { generateFileName, getProposedJobsUploadDir } from 'lib/api/fileManager'
import { APIMethodHandler } from 'lib/api/MethodHandler'
import { parseFormWithImages } from 'lib/api/parse-form'
import { validateOrSendError } from 'lib/api/validator'
import {
  createProposedJob,
  getProposedJobs,
  getProposedJobsAssignableTo,
} from 'lib/data/proposed-jobs'
import logger from 'lib/logger/logger'
import { ApiError, WrappedError } from 'lib/types/api-error'
import { ExtendedSession, Permission } from 'lib/types/auth'
import { APILogEvent } from 'lib/types/logger'
import {
  ProposedJobCreateData,
  ProposedJobCreateSchema,
} from 'lib/types/proposed-job'
import { NextApiRequest, NextApiResponse } from 'next'

export type ProposedJobsAPIGetResponse = Awaited<
  ReturnType<typeof getProposedJobs>
>
async function get(
  req: NextApiRequest,
  res: NextApiResponse<ProposedJobsAPIGetResponse>
) {
  const { assignableToPlan } = req.query
  let jobs
  if (assignableToPlan && typeof assignableToPlan === 'string') {
    jobs = await getProposedJobsAssignableTo(assignableToPlan)
  } else {
    jobs = await getProposedJobs()
  }
  res.status(200).json(jobs)
}

export type ProposedJobsAPIPostData = ProposedJobCreateData
export type ProposedJobsAPIPostResponse = Awaited<
  ReturnType<typeof createProposedJob>
>
async function post(
  req: NextApiRequest,
  res: NextApiResponse<ProposedJobsAPIPostResponse | WrappedError<ApiError>>,
  session: ExtendedSession
) {
  const temporaryName = generateFileName(30) // temporary name for the file
  const uploadDirectory = await getProposedJobsUploadDir()
  const { files, json } = await parseFormWithImages(
    req,
    res,
    temporaryName,
    uploadDirectory,
    10
  )

  const result = validateOrSendError(ProposedJobCreateSchema, json, res)
  if (!result) {
    return
  }

  const job = await createProposedJob(result, files)
  await logger.apiRequest(
    APILogEvent.JOB_CREATE,
    'proposed-jobs',
    result,
    session
  )

  res.status(201).json(job)
}

export default APIAccessController(
  [Permission.JOBS, Permission.PLANS],
  APIMethodHandler({ get, post })
)

export const config = {
  api: {
    bodyParser: false,
  },
}
