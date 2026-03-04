import { startOfTomorrow } from 'date-fns'
import { getActiveJobById } from 'lib/data/active-jobs'
import { getUpcomingAdorationSlots } from 'lib/data/adoration'
import { createNotification } from 'lib/data/notification'
import { getPostById } from 'lib/data/posts'
import {
  getAllWorkerIds,
  getWorkerIdsWorkingOnDate,
  getWorkerIdsWithFoodAllergies,
} from 'lib/data/workers'
import { getDateFromISOString } from 'lib/helpers/helpers'
import { Prisma } from 'lib/prisma/client'
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
    url: '/notifications',
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

// Sends a notification to all workers informing them of their plan tomorrow (has/doesn't have a job)
export async function sendDailyReminderNotification() {
  const tomorrow = startOfTomorrow()

  const allWorkerIds = await getAllWorkerIds()
  const workerIdsJobTomorrow = await getWorkerIdsWorkingOnDate(tomorrow)
  const workerIdsNoJobTomorrow = allWorkerIds.filter(
    worker => !workerIdsJobTomorrow.includes(worker)
  )

  const jobTomorrowPayload =
    'Zítra jste zapsán/a na práci. Pokud máte pocit, že to je špatně, zkontrolujte si nastavení své dostupnosti v profilu a kontaktujte tým SummerJob.'
  const noJobTomorrowPayload =
    'Zítra máte volno. Pokud máte pocit, že to je špatně, zkontrolujte si nastavení své dostupnosti v profilu a kontaktujte tým SummerJob.'

  await sendNotificationToWorkers(workerIdsJobTomorrow, jobTomorrowPayload)
  await sendNotificationToWorkers(workerIdsNoJobTomorrow, noJobTomorrowPayload)
}

// Sends a notification to all workers that have an upcoming adoration
export async function sendAdorationReminderNotification() {
  const HOURS = 1 // How many hours in advance to give the notification
  const adorationSlots = await getUpcomingAdorationSlots(HOURS)

  adorationSlots.forEach(slot =>
    slot.workers.forEach(async worker => {
      try {
        // Log the reminder so the notification gets sent only once
        await prisma.adorationReminderLogging.create({
          data: {
            workerId: worker.id,
            adorationSlotId: slot.id,
          },
        })
      } catch (err) {
        if (
          err instanceof Prisma.PrismaClientKnownRequestError &&
          err.code === 'P2002'
        ) {
          return
        }
        throw err
      }

      const payload = `Adorace na místě: ${slot.location} začíná za méně než ${HOURS} hodinu`
      await sendNotificationToWorkers([worker.id], payload)
    })
  )
}
