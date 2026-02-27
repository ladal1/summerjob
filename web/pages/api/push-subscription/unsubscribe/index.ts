import { APIAccessController } from 'lib/api/APIAccessControler'
import { APIMethodHandler } from 'lib/api/MethodHandler'
import { deletePushSubscription } from 'lib/data/push-subscriptions'
import prisma from 'lib/prisma/connection'
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

  const email = session.user?.email
  if (!email) {
    res.status(400).end()
    return
  }

  const worker = await prisma.worker.findUnique({
    where: { email },
    select: { id: true },
  })
  if (!worker) {
    res.status(400).end()
    return
  }

  const deleted = await deletePushSubscription(endpoint, worker!.id)
  deleted ? res.status(200).end() : res.status(404).end()
}

export default APIAccessController([], APIMethodHandler({ post }))
