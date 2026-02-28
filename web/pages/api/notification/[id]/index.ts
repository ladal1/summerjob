import { APIAccessController } from 'lib/api/APIAccessControler'
import { APIMethodHandler } from 'lib/api/MethodHandler'
import { ExtendedSession } from 'lib/types/auth'
import { NextApiRequest, NextApiResponse } from 'next'
import { markNotificationAsSeen } from 'lib/data/notification'
import { getWorkerIdFromSession } from 'lib/auth/auth'

// For marking a notification as seen
async function patch(
  req: NextApiRequest,
  res: NextApiResponse,
  session: ExtendedSession
) {
  const workerId = await getWorkerIdFromSession(session)
  if (!workerId) {
    res.status(403).end()
    return
  }

  const id = req.query.id as string
  const updated = await markNotificationAsSeen(id, workerId)
  if (updated.count === 0) {
    res.status(404).end()
    return
  }
  res.status(204).end()
}

export default APIAccessController([], APIMethodHandler({ patch }))
