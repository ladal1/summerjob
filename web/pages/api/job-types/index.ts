import { NextApiRequest, NextApiResponse } from 'next'
import { createJobType, getJobTypes } from 'lib/data/job-types'
import { APIAccessController } from 'lib/api/APIAccessControler'
import { APIMethodHandler } from 'lib/api/MethodHandler'
import { WrappedError, ApiError } from 'lib/types/api-error'
import { ExtendedSession, Permission } from 'lib/types/auth'
import { JobTypeCreateData, JobTypeCreateSchema } from 'lib/types/job-type'
import { parseForm } from 'lib/api/parse-form'
import {
  getActiveEventOrSendError,
  validateOrSendError,
} from 'lib/api/validator'
import logger from 'lib/logger/logger'
import { APILogEvent } from 'lib/types/logger'
import { isAccessAllowed } from 'lib/auth/auth'

export type JobTypesAPIGetResponse = Awaited<ReturnType<typeof getJobTypes>>

async function get(
  req: NextApiRequest,
  res: NextApiResponse<JobTypesAPIGetResponse | WrappedError<ApiError>>
) {
  const jobType = await getJobTypes()
  res.status(200).json(jobType)
}

export type JobTypesAPIPostData = JobTypeCreateData
export type JobTypesAPIPostResponse = Awaited<ReturnType<typeof createJobType>>
async function post(
  req: NextApiRequest,
  res: NextApiResponse<JobTypesAPIPostResponse | WrappedError<ApiError>>,
  session: ExtendedSession
) {
  if (!isAccessAllowed([Permission.ADMIN], session)) {
    res.status(403).end()
    return
  }
  const summerJobEvent = await getActiveEventOrSendError(res)
  if (!summerJobEvent) {
    return
  }
  const { json } = await parseForm(req)
  const data = validateOrSendError(JobTypeCreateSchema, json, res)
  if (!data) {
    return
  }
  await logger.apiRequest(
    APILogEvent.JOB_TYPE_CREATE,
    'job-types',
    json,
    session
  )
  const jobType = await createJobType(data)
  res.status(201).json(jobType)
}

export default APIAccessController([], APIMethodHandler({ get, post }))

export const config = {
  api: {
    bodyParser: false,
  },
}
