import { APIAccessController } from 'lib/api/APIAccessControler'
import { APIMethodHandler } from 'lib/api/MethodHandler'
import { createPushSubscription } from 'lib/data/push-subscriptions'
import prisma from 'lib/prisma/connection'
import { PushSubscription } from 'lib/prisma/zod'
import { ExtendedSession } from 'lib/types/auth'
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
  const email = session.user?.email
  if (!email) {
    res.status(400).json({ error: 'Missing session email' })
    return
  }

  const data = req.body
  if (!data) {
    res.status(400).end()
    return
  }
  const worker = await prisma.worker.findUnique({
    where: { email },
    select: { id: true },
  })

  const pushSubscription = <PushSubscription>{
    workerId: worker!.id,
    endpoint: data.endpoint,
    p256dh: data.keys.p256dh,
    auth: data.keys.auth,
  }
  await createPushSubscription(pushSubscription)
  res.status(201).end()
}

export default APIAccessController([], APIMethodHandler({ post }))
