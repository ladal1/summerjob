import { APIAccessController } from 'lib/api/APIAccessControler'
import { APIMethodHandler } from 'lib/api/MethodHandler'
import { generateFileName, getUploadDirForImages, renameFile } from 'lib/api/fileManager'
import { getPhotoPath, parseFormWithSingleImage } from 'lib/api/parse-form'
import { validateOrSendError } from 'lib/api/validator'
import { createWorker, createWorkers, getWorkers, updateWorker } from 'lib/data/workers'
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
  const temporaryName = generateFileName(30) // temporary name for the file
  const uploadDir = getUploadDirForImages()

  const { files, json } = await parseFormWithSingleImage(req, temporaryName, uploadDir)

  const singleWorker = validateOrSendError(WorkerCreateSchema, json, res)
  if (singleWorker) {
    const worker = await createWorker(singleWorker)
    /* Rename photo file and update worker with new photo path to it. */
    if (files.photoFile) {
      const temporaryPhotoPath = getPhotoPath(files.photoFile) // update photoPath
      singleWorker.photoPath = uploadDir + '/' + worker.id
      renameFile(temporaryPhotoPath, singleWorker.photoPath)
      await updateWorker(worker.id, singleWorker)
    }
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