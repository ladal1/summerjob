import prisma from 'lib/prisma/connection'
import { PushSubscription } from 'lib/prisma/zod'

export async function createPushSubscription(
  subscriptionData: PushSubscription
) {
  return await prisma.pushSubscription.upsert({
    where: {
      endpoint: subscriptionData.endpoint,
    },
    create: {
      ...subscriptionData,
    },
    update: {
      workerId: subscriptionData.workerId,
      p256dh: subscriptionData.p256dh,
      auth: subscriptionData.auth,
    },
  })
}

export async function deletePushSubscription(
  endpoint: string,
  workerId: string
) {
  return await prisma.pushSubscription.delete({
    where: {
      endpoint,
      workerId,
    },
  })
}
