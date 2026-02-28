import { APIAccessController } from 'lib/api/APIAccessControler'
import { APIMethodHandler } from 'lib/api/MethodHandler'
import { getWorkerIdFromSession } from 'lib/auth/auth'
import { createPushSubscription } from 'lib/data/push-subscriptions'
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
    res.status(403).end()
    return
  }

  // Parse the subscription coming from the browser
  const browserParsed = BrowserPushSubscriptionSchema.safeParse(req.body)
  if (!browserParsed.success) {
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
