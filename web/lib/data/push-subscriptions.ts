import prisma from 'lib/prisma/connection'
import { PushSubscriptionCreateData } from 'lib/types/push-subscription'

export async function createPushSubscription(
  subscriptionData: PushSubscriptionCreateData
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
  const subscription = await prisma.pushSubscription.findFirst({
    where: {
      endpoint,
      workerId,
    },
  })
  if (!subscription) {
    return null
  }

  return await prisma.pushSubscription.delete({
    where: {
      endpoint: subscription.endpoint,
    },
  })
}
