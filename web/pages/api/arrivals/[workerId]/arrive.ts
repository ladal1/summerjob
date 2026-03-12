import { APIAccessController } from 'lib/api/APIAccessControler'
import { APIMethodHandler } from 'lib/api/MethodHandler'
import { markWorkerArrived, unmarkWorkerArrived } from 'lib/data/arrivals'
import logger from 'lib/logger/logger'
import { Permission, ExtendedSession } from 'lib/types/auth'
import { APILogEvent } from 'lib/types/logger'
import { NextApiRequest, NextApiResponse } from 'next'

async function post(
  req: NextApiRequest,
  res: NextApiResponse,
  session: ExtendedSession
) {
  const workerId = req.query.workerId as string
  await markWorkerArrived(workerId)
  await logger.apiRequest(
    APILogEvent.WORKER_ARRIVAL,
    workerId,
    { arrived: true },
    session
  )
  res.status(204).end()
}

async function del(
  req: NextApiRequest,
  res: NextApiResponse,
  session: ExtendedSession
) {
  const workerId = req.query.workerId as string
  await unmarkWorkerArrived(workerId)
  await logger.apiRequest(
    APILogEvent.WORKER_ARRIVAL,
    workerId,
    { arrived: false },
    session
  )
  res.status(204).end()
}

export default APIAccessController(
  [Permission.WORKERS, Permission.ADMIN],
  APIMethodHandler({ post, del })
)
