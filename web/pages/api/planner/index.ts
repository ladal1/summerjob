import { APIAccessController } from 'lib/api/APIAccessControler'
import { APIMethodHandler } from 'lib/api/MethodHandler'
import { parseForm } from 'lib/api/parse-form'
import { validateOrSendError } from 'lib/api/validator'
import { requestPlanner } from 'lib/data/planner'
import logger from 'lib/logger/logger'
import { ExtendedSession, Permission } from 'lib/types/auth'
import { APILogEvent } from 'lib/types/logger'
import { PlannerSubmitSchema } from 'lib/types/planner'
import { NextApiRequest, NextApiResponse } from 'next'

export type PlannerAPIPostData = { planId: string }
async function post(
  req: NextApiRequest,
  res: NextApiResponse,
  session: ExtendedSession
) {
  const { json } = await parseForm(req)
  const result = validateOrSendError(PlannerSubmitSchema, json, res)
  if (!result) {
    return
  }
  await logger.apiRequest(
    APILogEvent.PLAN_PLANNER_START,
    'planner',
    json,
    session
  )
  await requestPlanner(result.planId)
  res.status(204).end()
}

export default APIAccessController(
  [Permission.PLANS],
  APIMethodHandler({ post })
)

export const config = {
  api: {
    bodyParser: false
  }
}