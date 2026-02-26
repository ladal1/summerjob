import { APIAccessController } from 'lib/api/APIAccessControler'
import { APIMethodHandler } from 'lib/api/MethodHandler'
import { deletePushSubscription } from 'lib/data/push-subscriptions'
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
  const { endpoint } = req.body
  if (!endpoint) {
    res.status(400).end()
    return
  }

  await deletePushSubscription(endpoint)
  res.status(201).end()
}

export default APIAccessController([], APIMethodHandler({ post }))
