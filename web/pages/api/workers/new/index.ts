import { APIAccessController } from 'lib/api/APIAccessControler'
import { APIMethodHandler } from 'lib/api/MethodHandler'
import { generateFileName, getWorkersUploadDir } from 'lib/api/fileManager'
import { parseFormWithImages } from 'lib/api/parse-form'
import { validateOrSendError } from 'lib/api/validator'
import { createWorker } from 'lib/data/workers'
import logger from 'lib/logger/logger'
import { ExtendedSession, Permission } from 'lib/types/auth'
import { APILogEvent } from 'lib/types/logger'
import { WorkerCreateDataInput, WorkerCreateSchema } from 'lib/types/worker'
import { NextApiRequest, NextApiResponse } from 'next'

export type WorkerAPIPostData = WorkerCreateDataInput
async function post(
  req: NextApiRequest,
  res: NextApiResponse,
  session: ExtendedSession
) {
  const temporaryName = generateFileName(30)
  const uploadDir = await getWorkersUploadDir()
  const { files, json } = await parseFormWithImages(
    req,
    res,
    temporaryName,
    uploadDir,
    1
  )
  const singleWorker = validateOrSendError(WorkerCreateSchema, json, res)
  if (!singleWorker) {
    return
  }
  const fileFieldNames = Object.keys(files)

  const worker = await createWorker(
    singleWorker,
    fileFieldNames.length !== 0 ? files[fileFieldNames[0]] : undefined
  )

  await logger.apiRequest(APILogEvent.WORKER_CREATE, 'workers', worker, session)

  res.status(201).json(worker)
}

export default APIAccessController(
  [Permission.WORKERS],
  APIMethodHandler({ post })
)

export const config = {
  api: {
    bodyParser: false,
  },
}
