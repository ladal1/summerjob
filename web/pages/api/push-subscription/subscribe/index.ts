import { APIAccessController } from 'lib/api/APIAccessControler'
import { APIMethodHandler } from 'lib/api/MethodHandler'
import { getWorkerIdFromSession } from 'lib/auth/auth'
import { createPushSubscription } from 'lib/data/push-subscriptions'
import logger from 'lib/logger/logger'
import { ExtendedSession } from 'lib/types/auth'
import {
  BrowserPushSubscriptionSchema,
  PushSubscriptionCreateData,
} from 'lib/types/push-subscription'
import { NextApiRequest, NextApiResponse } from 'next'

async function post(
  req: NextApiRequest,
  res: NextApiResponse,
  session: ExtendedSession
) {
  const workerId = await getWorkerIdFromSession(session)
  if (!workerId) {
    logger.error(
      `[push-subscription/subscribe] No worker found for session user (userId: ${session.userID}, username: ${session.username})`
    )
    res.status(403).end()
    return
  }

  // Parse the subscription coming from the browser
  const browserParsed = BrowserPushSubscriptionSchema.safeParse(req.body)
  if (!browserParsed.success) {
    logger.error(
      `[push-subscription/subscribe] Invalid push subscription payload (workerId: ${workerId}): ${JSON.stringify(browserParsed.error.issues)}`
    )
    res.status(400).json({
      error: 'Invalid push subscription payload',
    })
    return
  }
  const browserSub = browserParsed.data

  const pushSubscription = <PushSubscriptionCreateData>{
    workerId: workerId,
    endpoint: browserSub.endpoint,
    p256dh: browserSub.keys.p256dh,
    auth: browserSub.keys.auth,
  }
  await createPushSubscription(pushSubscription)
  res.status(200).end()
}

export default APIAccessController([], APIMethodHandler({ post }))
