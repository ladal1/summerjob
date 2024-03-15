import { APIAccessController } from 'lib/api/APIAccessControler'
import { APIMethodHandler } from 'lib/api/MethodHandler'
import { parseForm } from 'lib/api/parse-form'
import { validateOrSendError } from 'lib/api/validator'
import { createWorkers, getWorkers } from 'lib/data/workers'
import logger from 'lib/logger/logger'
import { ExtendedSession, Permission } from 'lib/types/auth'
import { APILogEvent } from 'lib/types/logger'
import { WorkersCreateDataInput, WorkersCreateSchema } from 'lib/types/worker'
import { NextApiRequest, NextApiResponse } from 'next'

export type WorkersAPIGetResponse = Awaited<ReturnType<typeof getWorkers>>
async function get(
  req: NextApiRequest,
  res: NextApiResponse<WorkersAPIGetResponse>
) {
  const { withoutJobInPlan } = req.query
  const planId =
    typeof withoutJobInPlan === 'string' ? withoutJobInPlan : undefined
  const users = await getWorkers(planId)
  res.status(200).json(users)
}

export type WorkersAPIPostData = WorkersCreateDataInput
async function post(
  req: NextApiRequest,
  res: NextApiResponse,
  session: ExtendedSession
) {
  const { json } = await parseForm(req)
  const multipleWorkers = validateOrSendError(WorkersCreateSchema, json, res)
  if (!multipleWorkers) {
    return
  }
  await logger.apiRequest(APILogEvent.WORKER_CREATE, 'workers', json, session)
  const workers = await createWorkers(multipleWorkers)
  res.status(201).json(workers)
}

export default APIAccessController(
  [Permission.WORKERS, Permission.PLANS],
  APIMethodHandler({ get, post })
)

export const config = {
  api: {
    bodyParser: false,
  },
}
