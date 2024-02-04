import { APIMethodHandler } from 'lib/api/MethodHandler'
import { validateOrSendError } from 'lib/api/validator'
import { getSMJSessionAPI, isAccessAllowed } from 'lib/auth/auth'
import { ApiError, WrappedError } from 'lib/types/api-error'
import { deleteWorker, getWorkerById, updateWorker } from 'lib/data/workers'
import logger from 'lib/logger/logger'
import { ExtendedSession, Permission } from 'lib/types/auth'
import { APILogEvent } from 'lib/types/logger'
import { WorkerUpdateDataInput, WorkerUpdateSchema } from 'lib/types/worker'
import { NextApiRequest, NextApiResponse } from 'next'
import { registerImage } from 'lib/data/photo'

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
  const workerData = validateOrSendError(WorkerUpdateSchema, req.body, res)
  if (!workerData) {
    return
  }
  await logger.apiRequest(APILogEvent.WORKER_MODIFY, id, req.body, session!)
  const updatedWorker = await updateWorker(id, workerData)

  await registerImage(updatedWorker?.id, workerData.photoFile)

  res.status(204).end()
}

async function del(req: NextApiRequest, res: NextApiResponse) {
  const id = req.query.id as string
  const session = await getSMJSessionAPI(req, res)
  const allowed = await isAllowedToDeleteWorker(session, res)
  if (!allowed) {
    return
  }
  await logger.apiRequest(APILogEvent.WORKER_DELETE, id, req.body, session!)
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
