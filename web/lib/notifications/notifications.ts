import { getActiveJobById } from 'lib/data/active-jobs'
import { createNotification } from 'lib/data/notification'
import { getPostById } from 'lib/data/posts'
import {
  getAllWorkerIds,
  getWorkerIdsWorkingOnDate,
  getWorkerIdsWithFoodAllergies,
} from 'lib/data/workers'
import { getDateFromISOString } from 'lib/helpers/helpers'
import prisma from 'lib/prisma/connection'
import { NotificationCreateData } from 'lib/types/notification'
import webpush from 'web-push'

webpush.setVapidDetails(
  process.env.NODE_ENV === 'development'
    ? 'mailto:admin@admin.cz'
    : 'https://jobplanner.summerjob.eu/',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

function normalizePayload(payload: string) {
  return JSON.stringify({
    title: 'SummerJob',
    body: payload,
    url: '/',
  })
}

async function sendPushToSubscription(
  sub: {
    id?: string
    endpoint: string
    p256dh: string
    auth: string
  },
  message: string
) {
  try {
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
  } catch (err) {
    // Delete stale subscriptions
    if (
      !!err &&
      typeof err === 'object' &&
      'statusCode' in err &&
      (err.statusCode === 404 || err.statusCode === 410)
    ) {
      await prisma.pushSubscription.deleteMany({
        where: { endpoint: sub.endpoint },
      })
    } else {
      console.error('Unexpected push subscription error:', err)
    }
  }
}

async function sendNotificationToWorkers(workerIds: string[], payload: string) {
  if (workerIds.length === 0) {
    return
  }
  // Create internal notification
  const notificationData: NotificationCreateData = {
    workerIds,
    text: payload,
  }
  await createNotification(notificationData)

  // Send push notification
  const subscriptions = await prisma.pushSubscription.findMany({
    where: {
      workerId: {
        in: workerIds,
      },
    },
  })
  const message = normalizePayload(payload)
  await Promise.all(
    subscriptions.map(sub => sendPushToSubscription(sub, message))
  )
}

export async function sendNotificationToAllWorkers(payload: string) {
  const workerIds = await getAllWorkerIds()
  await sendNotificationToWorkers(workerIds, payload)
}

export async function sendNotificationToWorkersForDay(
  payload: string,
  dateStr: string
) {
  const date = getDateFromISOString(dateStr)
  const workerIds = await getWorkerIdsWorkingOnDate(date)
  await sendNotificationToWorkers(workerIds, payload)
}

export async function sendNotificationToWorkersForJob(
  payload: string,
  jobId: string
) {
  const job = await getActiveJobById(jobId)
  if (!job) {
    throw new Error('Job with given id not found')
  }
  const workerIds = job.workers.map(w => w.id)
  await sendNotificationToWorkers(workerIds, payload)
}

export async function sendNotificationToWorkersForPost(
  payload: string,
  postId: string
) {
  const post = await getPostById(postId)
  if (!post) {
    throw new Error('Post with given id not found')
  }
  const workerIds = post.participants.map(w => w.workerId)
  await sendNotificationToWorkers(workerIds, payload)
}

export async function sendNotificationToWorkersWithFoodAllergies(
  payload: string
) {
  const workerIds = await getWorkerIdsWithFoodAllergies()
  await sendNotificationToWorkers(workerIds, payload)
}
