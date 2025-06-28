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
  prismaClient: PrismaTransactionClient = prisma
) {
  const data: {
    dateStart: Date
    length: number
    location: string
    eventId: string
    capacity: number
  }[] = []

  const currentDate = new Date(dateFrom)

  while (currentDate <= dateTo) {
    for (let hour = fromHour; hour < toHour; hour++) {
      for (let minute = 0; minute < 60; minute += length) {
        const slotStart = new Date(currentDate)
        slotStart.setHours(hour, minute, 0, 0)

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
