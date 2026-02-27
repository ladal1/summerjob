import { APIAccessController } from 'lib/api/APIAccessControler'
import { APIMethodHandler } from 'lib/api/MethodHandler'
import { sendNotificationToAllWorkers } from 'lib/notifications/notifications'
import { ExtendedSession, Permission } from 'lib/types/auth'
import { NextApiRequest, NextApiResponse } from 'next'

async function post(
  req: NextApiRequest,
  res: NextApiResponse,
  session: ExtendedSession
) {
  if (!session) {
    res.status(403).end()
    return
  }

  const { payload } = req.body
  if (!payload) {
    res.status(400).end()
    return
  }

  await sendNotificationToAllWorkers(payload)
  res.status(200).end()
}

export default APIAccessController(
  [Permission.ADMIN],
  APIMethodHandler({ post })
)
