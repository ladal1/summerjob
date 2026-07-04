import { add } from 'date-fns'
import prisma from 'lib/prisma/connection'
import {
  FrontendNotificationData,
  NotificationCreateData,
} from 'lib/types/notification'

export async function getWorkersNotifications(
  workerId: string
): Promise<FrontendNotificationData[]> {
  // Only get notifications that are not older than 2 months so that workers don't see notifications from old events
  const twoMonthsAgo = add(new Date(), { months: -2 })

  const notifications = await prisma.notification.findMany({
    where: {
      workers: {
        some: { id: workerId },
      },
      receivedAt: {
        gte: twoMonthsAgo,
      },
    },
    orderBy: {
      receivedAt: 'desc',
    },
    include: {
      seenByWorkers: {
        where: { id: workerId }, // check if notification has been seen by this worker
        select: { id: true },
      },
    },
  })

  return notifications.map(n => ({
    id: n.id,
    text: n.text,
    receivedAt: n.receivedAt.toISOString(),
    seen: n.seenByWorkers.length > 0,
  }))
}

export async function getUnreadNotificationsCount(
  workerId: string
): Promise<number> {
  return await prisma.notification.count({
    where: {
      workers: {
        some: {
          id: workerId,
        },
      },
      seenByWorkers: {
        none: {
          id: workerId,
        },
      },
    },
  })
}

export async function createNotification(
  notificationData: NotificationCreateData
) {
  return await prisma.notification.create({
    data: {
      text: notificationData.text,
      workers: {
        connect: notificationData.workerIds.map(id => ({ id })),
      },
    },
  })
}

export async function markNotificationAsSeen(
  notificationId: string,
  workerId: string
) {
  const notification = await prisma.notification.findFirst({
    where: {
      id: notificationId,
      workers: {
        some: { id: workerId },
      },
    },
    select: { id: true },
  })
  if (!notification) {
    throw new Error('Notification not found for this worker')
  }

  return await prisma.notification.update({
    where: {
      id: notificationId,
    },
    data: {
      seenByWorkers: {
        connect: { id: workerId },
      },
    },
  })
}
