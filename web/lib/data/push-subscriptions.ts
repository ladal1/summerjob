import prisma from 'lib/prisma/connection'
import { PushSubscription } from 'lib/prisma/zod'

export async function createPushSubscription(
  subscriptionData: PushSubscription
) {
  const subscription = await prisma.pushSubscription.create({
    data: {
      ...subscriptionData,
    },
  })
  return subscription
}

export async function deletePushSubscription(endpoint: string) {
  await prisma.pushSubscription.delete({
    where: {
      endpoint,
    },
  })
}
