import prisma from 'lib/prisma/connection'
import webpush from 'web-push'

webpush.setVapidDetails(
  'mailto:admin@admin.cz',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

function normalizePayload(payload: string) {
  return JSON.stringify({
    title: 'SummerJob',
    body: payload,
    url: '/my-plan',
  })
}

export async function sendNotificationToWorker(
  workerId: string,
  payload: string
) {
  const subscriptions = await prisma.pushSubscription.findMany({
    where: {
      workerId,
    },
  })

  const message = normalizePayload(payload)

  await Promise.all(
    subscriptions.map(async sub => {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        },
        message
      )
    })
  )
}

export async function sendNotificationToAllWorkers(payload: string) {
  const subscriptions = await prisma.pushSubscription.findMany()
  if (!subscriptions) {
    return
  }

  const message = normalizePayload(payload)

  await Promise.all(
    subscriptions.map(async sub => {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        },
        message
      )
    })
  )
}
