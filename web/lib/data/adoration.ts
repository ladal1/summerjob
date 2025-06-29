// lib/data/adoration.ts
import prisma from 'lib/prisma/connection'
import type { PrismaTransactionClient } from 'lib/types/prisma'

export async function getAdorationSlotsForDayAdmin(
  eventId: string,
  date: Date,
  prismaClient: PrismaTransactionClient = prisma
) {
  const end = new Date(date)
  end.setHours(23, 59, 59, 999)

  return prismaClient.adorationSlot.findMany({
    where: {
      eventId,
      dateStart: {
        gte: date,
        lte: end,
      },
    },
    include: {
      workers: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phone: true,
        },
      },
    },
    orderBy: { dateStart: 'asc' },
  })
}

export async function getAdorationSlotsForDayUser(
  eventId: string,
  date: Date,
  userId: string,
  prismaClient: PrismaTransactionClient = prisma
) {
  const end = new Date(date)
  end.setHours(23, 59, 59, 999)

  const all = await prismaClient.adorationSlot.findMany({
    where: {
      eventId,
      dateStart: {
        gte: date,
        lte: end,
      },
    },
    include: {
      workers: {
        select: {
          id: true,
        },
      },
    },
    orderBy: {
      dateStart: 'asc',
    },
  })

  return all
    .filter(slot => {
      const isUserSignedUp = slot.workers.some(w => w.id === userId)
      const hasFreeCapacity = slot.workers.length < slot.capacity
      return isUserSignedUp || hasFreeCapacity
    })
    .map(slot => {
      const isUserSignedUp = slot.workers.some(w => w.id === userId)
      return {
        id: slot.id,
        dateStart: slot.dateStart,
        location: slot.location,
        capacity: slot.capacity,
        length: slot.length,
        workerCount: slot.workers.length,
        isUserSignedUp,
      }
    })
}

export async function signUpForAdorationSlot(
  slotId: string,
  workerId: string,
  prismaClient: PrismaTransactionClient = prisma
) {
  return prismaClient.adorationSlot.update({
    where: { id: slotId },
    data: {
      workers: {
        connect: { id: workerId },
      },
    },
  })
}

export async function createAdorationSlotsBulk(
  eventId: string,
  dateFrom: Date,
  dateTo: Date,
  fromHour: number,
  toHour: number,
  length: number,
  location: string,
  capacity: number,
  fromMinute: number = 0,
  toMinute: number = 0,
  prismaClient: PrismaTransactionClient = prisma
) {
  const data: {
    dateStart: Date
    length: number
    location: string
    eventId: string
    capacity: number
  }[] = []

  // Create local date objects to avoid timezone issues
  const startDate = new Date(dateFrom.getFullYear(), dateFrom.getMonth(), dateFrom.getDate())
  const endDate = new Date(dateTo.getFullYear(), dateTo.getMonth(), dateTo.getDate())
  const currentDate = new Date(startDate)

  // Calculate total start and end minutes
  const startTotalMinutes = fromHour * 60 + fromMinute
  const endTotalMinutes = toHour * 60 + toMinute
  
  // Check if this is a cross-day time range (e.g., 23:00 to 07:00)
  const isCrossDay = startTotalMinutes >= endTotalMinutes

  while (currentDate <= endDate) {
    if (isCrossDay) {
      // Handle cross-day time range (e.g., 23:00 to 07:00 next day)
      
      // First part: from start time to end of day (23:59)
      for (let totalMinutes = startTotalMinutes; totalMinutes < 24 * 60; totalMinutes += length) {
        const hour = Math.floor(totalMinutes / 60)
        const minute = totalMinutes % 60

        // Skip if we've gone past 23:59
        if (hour >= 24) break

        const slotStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), hour, minute, 0, 0)

        data.push({
          dateStart: slotStart,
          length,
          location,
          eventId,
          capacity,
        })
      }

      // Second part: from start of next day (00:00) to end time
      // Only create these slots if we're not on the last day or if the last day allows next day slots
      const nextDay = new Date(currentDate)
      nextDay.setDate(nextDay.getDate() + 1)
      
      // Only create next day slots if the next day is within the date range or it's not the last day
      if (nextDay <= endDate || currentDate < endDate) {
        for (let totalMinutes = 0; totalMinutes < endTotalMinutes; totalMinutes += length) {
          const hour = Math.floor(totalMinutes / 60)
          const minute = totalMinutes % 60

          const slotStart = new Date(nextDay.getFullYear(), nextDay.getMonth(), nextDay.getDate(), hour, minute, 0, 0)

          data.push({
            dateStart: slotStart,
            length,
            location,
            eventId,
            capacity,
          })
        }
      }
    } else {
      // Handle normal same-day time range (e.g., 08:00 to 17:00)
      for (let totalMinutes = startTotalMinutes; totalMinutes < endTotalMinutes; totalMinutes += length) {
        const hour = Math.floor(totalMinutes / 60)
        const minute = totalMinutes % 60

        // Skip if we've gone past 23:59
        if (hour >= 24) break

        const slotStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), hour, minute, 0, 0)

        data.push({
          dateStart: slotStart,
          length,
          location,
          eventId,
          capacity,
        })
      }
    }

    currentDate.setDate(currentDate.getDate() + 1)
  }

  return prismaClient.adorationSlot.createMany({ data })
}

export async function logoutFromAdorationSlot(
  slotId: string,
  workerId: string,
  prismaClient: PrismaTransactionClient = prisma
) {
  return prismaClient.adorationSlot.update({
    where: { id: slotId },
    data: {
      workers: {
        disconnect: { id: workerId },
      },
    },
  })
}

export async function getWorkerAdorationSlotsForDay(
  workerId: string,
  date: Date,
  prismaClient: PrismaTransactionClient = prisma
) {
  const start = new Date(date)
  start.setHours(0, 0, 0, 0)

  const end = new Date(date)
  end.setHours(23, 59, 59, 999)

  return prismaClient.adorationSlot.findMany({
    where: {
      dateStart: {
        gte: start,
        lte: end,
      },
      workers: {
        some: {
          id: workerId,
        },
      },
    },
    include: {
      workers: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phone: true,
        },
      },
    },
    orderBy: { dateStart: 'asc' },
  })
}
export async function existsAdorationSlot(): Promise<boolean> {
  const count = await prisma.adorationSlot.count()
  return count > 0
}

export async function findNearestDateWithAdorationSlots(
  eventId: string,
  fromDate: Date,
  prismaClient: PrismaTransactionClient = prisma
): Promise<string | null> {
  // Set the start time to beginning of the day
  const startDate = new Date(fromDate)
  startDate.setHours(0, 0, 0, 0)

  // Find the earliest slot from the given date onwards
  const nearestSlot = await prismaClient.adorationSlot.findFirst({
    where: {
      eventId,
      dateStart: {
        gte: startDate,
      },
    },
    orderBy: {
      dateStart: 'asc',
    },
    select: {
      dateStart: true,
    },
  })

  return nearestSlot ? nearestSlot.dateStart.toISOString().slice(0, 10) : null
}
