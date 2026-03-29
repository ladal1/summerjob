import { APIAccessController } from 'lib/api/APIAccessControler'
import { APIMethodHandler } from 'lib/api/MethodHandler'
import { hideWorker, unhideWorker } from 'lib/data/arrivals'
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
  await hideWorker(workerId)
  await logger.apiRequest(
    APILogEvent.WORKER_NO_SHOW,
    workerId,
    { show: false },
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
  await unhideWorker(workerId)
  await logger.apiRequest(
    APILogEvent.WORKER_NO_SHOW,
    workerId,
    { show: true },
    session
  )
  res.status(204).end()
}

export default APIAccessController(
  [Permission.WORKERS, Permission.ADMIN],
  APIMethodHandler({ post, del })
)
