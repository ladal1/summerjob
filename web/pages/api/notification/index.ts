import { NextApiRequest, NextApiResponse } from 'next'
import { APIAccessController } from 'lib/api/APIAccessControler'
import { APIMethodHandler } from 'lib/api/MethodHandler'
import { WrappedError, ApiError } from 'lib/types/api-error'
import { ExtendedSession } from 'lib/types/auth'
import { getWorkersNotifications } from 'lib/data/notification'
import { getWorkerIdFromSession } from 'lib/auth/auth'

export type NotificationAPIGetResponse = Awaited<
  ReturnType<typeof getWorkersNotifications>
>

async function get(
  req: NextApiRequest,
  res: NextApiResponse<NotificationAPIGetResponse | WrappedError<ApiError>>,
  session: ExtendedSession
) {
  const id = await getWorkerIdFromSession(session)
  if (!id) {
    res.status(403).end()
    return
  }

  const notifications = await getWorkersNotifications(id)
  res.status(200).json(notifications)
}

export default APIAccessController([], APIMethodHandler({ get }))
