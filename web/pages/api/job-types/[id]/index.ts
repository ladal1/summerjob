import { APIAccessController } from 'lib/api/APIAccessControler'
import { APIMethodHandler } from 'lib/api/MethodHandler'
import { parseForm } from 'lib/api/parse-form'
import { validateOrSendError } from 'lib/api/validator'
import { isAccessAllowed } from 'lib/auth/auth'
import {
  deleteJobType,
  getJobTypeById,
  updateJobType,
} from 'lib/data/job-types'
import logger from 'lib/logger/logger'
import { ExtendedSession, Permission } from 'lib/types/auth'
import { JobTypeUpdateSchema } from 'lib/types/job-type'
import { APILogEvent } from 'lib/types/logger'
import { NextApiRequest, NextApiResponse } from 'next'

async function get(req: NextApiRequest, res: NextApiResponse) {
  const id = req.query.id as string
  const jobType = await getJobTypeById(id)
  if (!jobType) {
    res.status(404).end()
    return
  }
  res.status(200).json(jobType)
}

async function patch(
  req: NextApiRequest,
  res: NextApiResponse,
  session: ExtendedSession
) {
  if (!isAccessAllowed([Permission.ADMIN], session)) {
    res.status(403).end()
    return
  }
  const id = req.query.id as string
  const { json } = await parseForm(req)
  const jobTypeData = validateOrSendError(JobTypeUpdateSchema, json, res)
  if (!jobTypeData) {
    return
  }
  await logger.apiRequest(APILogEvent.JOB_TYPE_MODIFY, id, json, session)
  await updateJobType(id, jobTypeData)
  res.status(204).end()
}

async function del(
  req: NextApiRequest,
  res: NextApiResponse,
  session: ExtendedSession
) {
  if (!isAccessAllowed([Permission.ADMIN], session)) {
    res.status(403).end()
    return
  }
  const id = req.query.id as string
  await logger.apiRequest(APILogEvent.JOB_TYPE_DELETE, id, {}, session)
  await deleteJobType(id)
  res.status(204).end()
}

export default APIAccessController([], APIMethodHandler({ get, patch, del }))

export const config = {
  api: {
    bodyParser: false,
  },
}
