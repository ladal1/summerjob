import { APIAccessController } from 'lib/api/APIAccessControler'
import { APIMethodHandler } from 'lib/api/MethodHandler'
import { parseForm } from 'lib/api/parse-form'
import { validateOrSendError } from 'lib/api/validator'
import {
  deleteActiveJob,
  getActiveJobById,
  updateActiveJob,
} from 'lib/data/active-jobs'
import logger from 'lib/logger/logger'
import { ActiveJobUpdateSchema } from 'lib/types/active-job'
import { ExtendedSession, Permission } from 'lib/types/auth'
import { APILogEvent } from 'lib/types/logger'
import { NextApiRequest, NextApiResponse } from 'next'

async function patch(
  req: NextApiRequest,
  res: NextApiResponse,
  session: ExtendedSession
) {
  const id = req.query.jobId as string
  const { json } = await parseForm(req)

  const data = validateOrSendError(ActiveJobUpdateSchema, json, res)
  if (!data) {
    return
  }

  // A reception user can only change "completed" and "proposedJob"."privateDescription"
  if (session.permissions.includes(Permission.RECEPTION)) {
    const allowedPlanProps = ['completed', 'proposedJob']
    const allowedJobProps = ['privateDescription']

    const disallowedPlanProps = Object.keys(data).filter(
      key => !allowedPlanProps.includes(key)
    )
    const disallowedJobProps = Object.keys(data.proposedJob ?? {}).filter(
      key => !allowedJobProps.includes(key)
    )

    if (disallowedPlanProps.length !== 0 || disallowedJobProps.length !== 0) {
      res.status(403).end()
      return
    }
  }

  await logger.apiRequest(APILogEvent.PLAN_JOB_MODIFY, id, json, session)
  await updateActiveJob(id, data)
  res.status(204).end()
}

export type ActiveJobAPIGetResponse = Awaited<
  ReturnType<typeof getActiveJobById>
>
async function get(
  req: NextApiRequest,
  res: NextApiResponse<ActiveJobAPIGetResponse>
) {
  const id = req.query.jobId as string
  const job = await getActiveJobById(id)
  if (!job) {
    res.status(404).end()
    return
  }
  res.status(200).json(job)
}

async function del(
  req: NextApiRequest,
  res: NextApiResponse,
  session: ExtendedSession
) {
  const id = req.query.jobId as string
  await logger.apiRequest(APILogEvent.PLAN_JOB_DELETE, id, {}, session)
  await deleteActiveJob(id)
  res.status(204).end()
}

export default APIAccessController(
  {
    GET: [Permission.PLANS],
    PATCH: [Permission.PLANS, Permission.RECEPTION],
    DELETE: [Permission.PLANS],
  },
  APIMethodHandler({ patch, get, del })
)

export const config = {
  api: {
    bodyParser: false,
  },
}
