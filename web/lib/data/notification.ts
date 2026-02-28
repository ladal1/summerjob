import prisma from 'lib/prisma/connection'
import type { Notification } from 'lib/prisma/zod'
import { NotificationCreateData } from 'lib/types/notification'

export async function getWorkersNotifications(
  workerId: string
): Promise<Notification[]> {
  return await prisma.notification.findMany({
    where: {
      workerId,
    },
    orderBy: {
      receivedAt: 'desc',
    },
  })
}

export async function getUnreadNotificationsCount(
  workerId: string
): Promise<number> {
  return await prisma.notification.count({
    where: {
      workerId,
      seen: false,
    },
  })
}

export async function createNotification(
  notificationData: NotificationCreateData
) {
  return await prisma.notification.create({
    data: {
      ...notificationData,
    },
  })
}

export async function markNotificationAsSeen(
  notificationId: string,
  workerId: string
) {
  return await prisma.notification.updateMany({
    where: {
      id: notificationId,
      workerId,
    },
    data: {
      seen: true,
    },
  })
}

export async function deleteNotification(
  notificationId: string,
  workerId: string
) {
  return await prisma.notification.deleteMany({
    where: {
      id: notificationId,
      workerId,
    },
  })
}
