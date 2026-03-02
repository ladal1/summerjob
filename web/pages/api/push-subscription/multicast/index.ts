import { APIAccessController } from 'lib/api/APIAccessControler'
import { APIMethodHandler } from 'lib/api/MethodHandler'
import {
  sendNotificationToAllWorkers,
  sendNotificationToWorkersForDay,
  sendNotificationToWorkersForJob,
  sendNotificationToWorkersForPost,
  sendNotificationToWorkersWithFoodAllergies,
} from 'lib/notifications/notifications'
import { ExtendedSession, Permission } from 'lib/types/auth'
import { NotificationMulticastRequestSchema } from 'lib/types/notification'
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

  const parsed = NotificationMulticastRequestSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).end()
    return
  }
  const { payload, target } = parsed.data
  try {
    switch (target.type) {
      case 'everyone':
        await sendNotificationToAllWorkers(payload)
        break
      case 'working-on-day':
        await sendNotificationToWorkersForDay(payload, target.date)
        break
      case 'working-on-job':
        await sendNotificationToWorkersForJob(payload, target.jobId)
        break
      case 'signed-up-for-post':
        await sendNotificationToWorkersForPost(payload, target.postId)
        break
      case 'food-allergies':
        await sendNotificationToWorkersWithFoodAllergies(payload)
        break
      default:
        res.status(404).end()
        return
    }

    res.status(200).end()
  } catch (e: unknown) {
    console.error('Unexpected error in notification multicast: ', e)
    res.status(500).end()
  }
}

export default APIAccessController(
  [Permission.ADMIN],
  APIMethodHandler({ post })
)
