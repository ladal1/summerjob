import { APIAccessController } from 'lib/api/APIAccessControler'
import { APIMethodHandler } from 'lib/api/MethodHandler'
import { validateOrSendError } from 'lib/api/validator'
import { createWorker, createWorkers, getWorkers } from 'lib/data/workers'
import { useAPIWorkerUpdate } from 'lib/fetcher/worker'
import logger from 'lib/logger/logger'
import { ExtendedSession, Permission } from 'lib/types/auth'
import { APILogEvent } from 'lib/types/logger'
import {
  WorkerCreateDataInput,
  WorkerCreateSchema,
  WorkersCreateDataInput,
  WorkersCreateSchema,
} from 'lib/types/worker'
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

export type WorkersAPIPostData = WorkerCreateDataInput | WorkersCreateDataInput
async function post(
  req: NextApiRequest,
  res: NextApiResponse,
  session: ExtendedSession
) {
  const singleWorker = WorkerCreateSchema.safeParse(req.body)
  if (singleWorker.success) {
    const worker = await createWorker(singleWorker.data)
    await logger.apiRequest(
      APILogEvent.WORKER_CREATE,
      'workers',
      req.body,
      session
    )
    res.status(201).json(worker)
    return
  }
  const multipleWorkers = validateOrSendError(
    WorkersCreateSchema,
    req.body,
    res
  )
  if (!multipleWorkers) {
    return
  }
  await logger.apiRequest(
    APILogEvent.WORKER_CREATE,
    'workers',
    req.body,
    session
  )
  const workers = await createWorkers(multipleWorkers)
  res.status(201).json(workers)
}

export default APIAccessController(
  [Permission.WORKERS, Permission.PLANS],
  APIMethodHandler({ get, post })
)
