import { APIMethodHandler } from 'lib/api/MethodHandler'
import { validateOrSendError } from 'lib/api/validator'
import { getSMJSessionAPI, isAccessAllowed } from 'lib/auth/auth'
import { ApiError, WrappedError } from 'lib/types/api-error'
import { deleteWorker, getWorkerById, getWorkerPhotoById, updateWorker } from 'lib/data/workers'
import logger from 'lib/logger/logger'
import { ExtendedSession, Permission } from 'lib/types/auth'
import { APILogEvent } from 'lib/types/logger'
import { WorkerUpdateDataInput, WorkerUpdateSchema } from 'lib/types/worker'
import { NextApiRequest, NextApiResponse } from 'next'
import { getPhotoPath, parseFormWithSingleImage } from 'lib/api/parse-form'
import { deleteFile, getUploadDirForImages } from 'lib/api/fileManager'
import formidable from 'formidable'

export type WorkerAPIGetResponse = Awaited<ReturnType<typeof getWorkerById>>
async function get(
  req: NextApiRequest,
  res: NextApiResponse<WorkerAPIGetResponse | WrappedError<ApiError>>
) {
  const id = req.query.id as string
  const session = await getSMJSessionAPI(req, res)
  const allowed = await isAllowedToAccessWorker(session, id, res)
  if (!allowed) {
    return
  }
  const user = await getWorkerById(id)
  if (!user) {
    res.status(404).end()
    return
  }
  res.status(200).json(user)
}

export type WorkerAPIPatchData = WorkerUpdateDataInput
async function patch(req: NextApiRequest, res: NextApiResponse) {
  const id = req.query.id as string
  const session = await getSMJSessionAPI(req, res)
  const allowed = await isAllowedToAccessWorker(session, id, res)
  if (!allowed) {
    return
  }

  const { files, json } = await parseFormWithSingleImage(req, id, getUploadDirForImages())

  /* Validate simple data from json. */
  const workerData = validateOrSendError(WorkerUpdateSchema, json, res)
  if (!workerData) {
    return
  }

  /* Get photoPath from uploaded photoFile. If there was uploaded image for this user, it will be deleted. */
  if (files.photoFile) {
    const photoPath = getPhotoPath(files.photoFile) // update photoPath
    const worker = await getWorkerPhotoById(id)
    if(worker?.photoPath && worker?.photoPath !== photoPath) { // if original image exists and it is named differently (meaning it wasn't replaced already by parseFormWithSingleImage) delete it 
      deleteFile(worker.photoPath) // delete original image if necessary
      console.log("here")
    }
    workerData.photoPath = photoPath
    console.log(photoPath)
    
  }
  /* If original file was deleted on client and was not replaced (it is not in files) file should be deleted. */
  else if (workerData.photoFileRemoved) {
    const worker = await getWorkerPhotoById(id)
    if(worker?.photoPath) { 
      deleteFile(worker.photoPath) // delete original image if necessary
    }
    workerData.photoPath = ''
  }
  
  await logger.apiRequest(APILogEvent.WORKER_MODIFY, id, workerData, session!)
  await updateWorker(id, workerData)

  res.status(204).end()
}

async function del(req: NextApiRequest, res: NextApiResponse) {
  const id = req.query.id as string
  const session = await getSMJSessionAPI(req, res)
  const allowed = await isAllowedToDeleteWorker(session, res)
  if (!allowed) {
    return
  }

  const worker = await getWorkerPhotoById(id)
  if (worker && worker.photoPath) {
    deleteFile(worker.photoPath) // delete original image if it exists
  }

  await logger.apiRequest(APILogEvent.WORKER_DELETE, id, {}, session!)
  await deleteWorker(id)

  res.status(204).end()
}

async function isAllowedToAccessWorker(
  session: ExtendedSession | null,
  workerId: string,
  res: NextApiResponse
) {
  if (!session) {
    res.status(401).end()
    return
  }
  const regularAccess = isAccessAllowed([Permission.WORKERS], session)
  if (regularAccess) {
    return true
  }
  // Users can access their own data and modify them in profile page
  if (session.userID === workerId) {
    return true
  }
  res.status(403).end()
  return false
}

async function isAllowedToDeleteWorker(
  session: ExtendedSession | null,
  res: NextApiResponse
) {
  if (!session) {
    res.status(401).end()
    return
  }
  const regularAccess = isAccessAllowed([Permission.WORKERS], session)
  if (!regularAccess) {
    res.status(403).end()
  }
  return true
}

// Access control is done individually in this case to allow users to access their own data
export default APIMethodHandler({ get, patch, del })

export const config = {
  api: {
    bodyParser: false
  }
}