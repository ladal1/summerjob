import { APIAccessController } from 'lib/api/APIAccessControler'
import { APIMethodHandler } from 'lib/api/MethodHandler'
import {
  generateFileName,
  getUploadDirForImages,
  renameFile,
  updatePhotoPathByNewFilename,
} from 'lib/api/fileManager'
import { getPhotoPath, parseFormWithImages } from 'lib/api/parse-form'
import { validateOrSendError } from 'lib/api/validator'
import { cache_getActiveSummerJobEventId } from 'lib/data/cache'
import { createWorker, updateWorker } from 'lib/data/workers'
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
  const activeEventId = await cache_getActiveSummerJobEventId()
  const temporaryName = generateFileName(30) // temporary name for the file
  const uploadDir = getUploadDirForImages() + '/' + activeEventId + '/workers'
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
  let worker = await createWorker(singleWorker)
  /* Rename photo file and update worker with new photo path to it. */
  const fileFieldNames = Object.keys(files)
  if (fileFieldNames.length !== 0) {
    const file = files[fileFieldNames[0]]
    const temporaryPhotoPath = getPhotoPath(file) // update photoPath
    singleWorker.photoPath =
      updatePhotoPathByNewFilename(temporaryPhotoPath, worker.id) ?? ''
    renameFile(temporaryPhotoPath, singleWorker.photoPath)
    const updatedWorker = await updateWorker(worker.id, singleWorker)
    if (updatedWorker) worker = updatedWorker
  }
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