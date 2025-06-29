// lib/data/adoration.ts
import prisma from 'lib/prisma/connection'
import type { PrismaTransactionClient } from 'lib/types/prisma'
import { startOfDay, endOfDay, addDays, format } from 'date-fns'
import { fromZonedTime } from 'date-fns-tz'

// CEST timezone identifier
const CEST_TZ = 'Europe/Prague'

// Utility functions for timezone conversions
function cestDateToUtc(date: Date): { startUTC: Date; endUTC: Date } {
  // Convert CEST date to start and end of day in UTC
  const cestStart = startOfDay(date)
  const cestEnd = endOfDay(date)
  
  return {
    startUTC: fromZonedTime(cestStart, CEST_TZ),
    endUTC: fromZonedTime(cestEnd, CEST_TZ)
  }
}

function createSlotTimeUtc(date: Date, hour: number, minute: number): Date {
  // Create a CEST time and convert to UTC
  const cestTime = new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour, minute, 0, 0)
  return fromZonedTime(cestTime, CEST_TZ)
}

export async function getAdorationSlotsForDayAdmin(
  eventId: string,
  date: Date,
  prismaClient: PrismaTransactionClient = prisma
) {
  const { startUTC, endUTC } = cestDateToUtc(date)

  return prismaClient.adorationSlot.findMany({
    where: {
      eventId,
      dateStart: {
        gte: startUTC,
        lte: endUTC,
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
  const { startUTC, endUTC } = cestDateToUtc(date)
  
  const all = await prismaClient.adorationSlot.findMany({
    where: {
      eventId,
      dateStart: {
        gte: startUTC,
        lte: endUTC,
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

  // Calculate total start and end minutes
  const startTotalMinutes = fromHour * 60 + fromMinute
  const endTotalMinutes = toHour * 60 + toMinute
  
  // Check if this is a cross-day time range (e.g., 23:00 to 07:00)
  const isCrossDay = startTotalMinutes >= endTotalMinutes

  let currentDate = new Date(dateFrom)
  
  while (currentDate <= dateTo) {
    if (isCrossDay) {
      // Handle cross-day time range (e.g., 23:00 to 07:00 next day)
      
      // First part: from start time to end of day (23:59)
      for (let totalMinutes = startTotalMinutes; totalMinutes < 24 * 60; totalMinutes += length) {
        const hour = Math.floor(totalMinutes / 60)
        const minute = totalMinutes % 60

        if (hour >= 24) break

        const slotStart = createSlotTimeUtc(currentDate, hour, minute)
        data.push({
          dateStart: slotStart,
          length,
          location,
          eventId,
          capacity,
        })
      }

      // Second part: from start of next day (00:00) to end time
      const nextDay = addDays(currentDate, 1)
      
      // Only create next day slots if the next day is within the date range or it's not the last day
      if (nextDay <= dateTo || currentDate < dateTo) {
        for (let totalMinutes = 0; totalMinutes < endTotalMinutes; totalMinutes += length) {
          const hour = Math.floor(totalMinutes / 60)
          const minute = totalMinutes % 60

          const slotStart = createSlotTimeUtc(nextDay, hour, minute)
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

        if (hour >= 24) break

        const slotStart = createSlotTimeUtc(currentDate, hour, minute)
        data.push({
          dateStart: slotStart,
          length,
          location,
          eventId,
          capacity,
        })
      }
    }

    currentDate = addDays(currentDate, 1)
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
  const { startUTC: start, endUTC: end } = cestDateToUtc(date)

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
  const { startUTC: startDate } = cestDateToUtc(fromDate)

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

  return nearestSlot ? format(nearestSlot.dateStart, 'yyyy-MM-dd') : null
}
