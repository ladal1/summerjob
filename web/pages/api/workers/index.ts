import { APIAccessController } from 'lib/api/APIAccessControler'
import { APIMethodHandler } from 'lib/api/MethodHandler'
import { generateFileName } from 'lib/api/fileManager'
import { parseForm, parseFormWithSingleImage } from 'lib/api/parse-form'
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

//TODO: divide single worker from multiple workers and create support for photo uploads
export type WorkersAPIPostData = WorkerCreateDataInput | WorkersCreateDataInput
async function post(
  req: NextApiRequest,
  res: NextApiResponse,
  session: ExtendedSession
) {
  const temporaryName = generateFileName()
  const { files, json } = await parseFormWithSingleImage(req, temporaryName) // TODO: manage file
  console.log(json)

  const singleWorker = validateOrSendError(WorkerCreateSchema, json, res)
  if (singleWorker) {
    const worker = await createWorker(singleWorker)
    await logger.apiRequest(
      APILogEvent.WORKER_CREATE,
      'workers',
      singleWorker,
      session
    )
    res.status(201).json(worker)
    return
  }
  const multipleWorkers = validateOrSendError(
    WorkersCreateSchema,
    json,
    res
  )
  if (!multipleWorkers) {
    return
  }
  await logger.apiRequest(
    APILogEvent.WORKER_CREATE,
    'workers',
    multipleWorkers,
    session
  )
  const workers = await createWorkers(multipleWorkers)
  res.status(201).json(workers)
}

export default APIAccessController(
  [Permission.WORKERS, Permission.PLANS],
  APIMethodHandler({ get, post })
)

export const config = {
  api: {
    bodyParser: false
  }
}