import prisma from 'lib/prisma/connection'
import {
  SummerJobEventComplete,
  SummerJobEventCreateData,
  SummerJobEventUpdateData,
} from 'lib/types/summerjob-event'
import {
  cache_getActiveSummerJobEvent,
  cache_getActiveSummerJobEventId,
  cache_setActiveSummerJobEvent,
} from './cache'
import { InvalidDataError } from './internal-error'
import {
  blockNonAdmins,
  addAdminsToEvent,
  unblockRegisteredUsers,
} from './users'
import { PrismaTransactionClient } from 'lib/types/prisma'
import { hash, compare } from 'bcryptjs'

export async function getSummerJobEventById(
  id: string
): Promise<SummerJobEventComplete | null> {
  const event = await prisma.summerJobEvent.findUnique({
    where: {
      id,
    },
    include: {
      areas: {
        include: {
          jobs: true,
        },
      },
      plans: true,
    },
  })
  return event
}

export async function getSummerJobEvents(): Promise<SummerJobEventComplete[]> {
  const events = await prisma.summerJobEvent.findMany({
    orderBy: {
      startDate: 'desc',
    },
    include: {
      areas: {
        include: {
          jobs: true,
        },
      },
      plans: true,
    },
  })
  return events
}

export async function getActiveSummerJobEvent() {
  const events = await prisma.summerJobEvent.findMany({
    where: {
      isActive: true,
    },
    include: {
      workerAvailability: true,
    },
  })
  return events.length > 0 ? events[0] : undefined
}

export async function updateSummerJobEvent(
  id: string,
  event: SummerJobEventUpdateData
) {
  if (!event.isActive) {
    throw new InvalidDataError(
      'Cannot set event to inactive, set another to active instead.'
    )
  }
  const currentlyActiveEvent = await cache_getActiveSummerJobEvent()
  if (!currentlyActiveEvent || currentlyActiveEvent.id !== id) {
    return await prisma.$transaction(async transaction => {
      const newEvent = await transaction.summerJobEvent.findUniqueOrThrow({
        where: {
          id,
        },
      })
      await blockNonAdmins(transaction)
      await addAdminsToEvent(newEvent.id, transaction)
      const updatedEvent = await setActiveSummerJobEvent(id, transaction)
      await unblockRegisteredUsers(newEvent.id, transaction)
      return updatedEvent
    })
  }
  return currentlyActiveEvent
}

export async function setActiveSummerJobEvent(
  id: string,
  transaction: PrismaTransactionClient
) {
  await transaction.summerJobEvent.updateMany({
    data: {
      isActive: false,
    },
  })
  const newEvent = await transaction.summerJobEvent.update({
    where: {
      id,
    },
    data: {
      isActive: true,
    },
  })

  cache_setActiveSummerJobEvent(newEvent)
  return newEvent
}

export async function createSummerJobEvent(event: SummerJobEventCreateData) {
  const createdEvent = await prisma.summerJobEvent.create({
    data: event,
  })
  return createdEvent
}

export async function deleteSummerJobEvent(id: string) {
  const activeEventId = await cache_getActiveSummerJobEventId()
  if (activeEventId === id) {
    throw new InvalidDataError(
      'Cannot delete active event, set another to active and then delete.'
    )
  }
  const event = await prisma.summerJobEvent.delete({
    where: {
      id,
    },
  })
  return event
}

export async function toggleApplicationOpen(id: string) {
  const event = await prisma.summerJobEvent.findUnique({
    where: { id },
  })

  if (!event) {
    throw new InvalidDataError('Event not found')
  }

  const updated = await prisma.summerJobEvent.update({
    where: { id },
    data: {
      isApplicationOpen: !event.isApplicationOpen,
    },
  })

  return updated.isApplicationOpen
}

export async function setApplicationPasswordProtection(
  id: string,
  enable: boolean,
  password?: string
): Promise<boolean> {
  const event = await prisma.summerJobEvent.findUnique({
    where: { id },
  })

  if (!event) {
    throw new InvalidDataError('Event not found')
  }

  if (enable && !password) {
    throw new InvalidDataError('Password is required to enable protection')
  }

  let applicationPasswordHash: string | null = null

  if (enable && password) {
    applicationPasswordHash = await hash(password, 10)
  }

  const updated = await prisma.summerJobEvent.update({
    where: { id },
    data: {
      isPasswordProtected: enable,
      applicationPasswordHash,
    },
  })

  return updated.isPasswordProtected
}

export async function checkApplicationPassword(
  eventId: string,
  password: string
) {
  const event = await prisma.summerJobEvent.findUnique({
    where: { id: eventId },
    select: {
      isPasswordProtected: true,
      applicationPasswordHash: true,
    },
  })

  if (!event) {
    throw new Error('Ročník nenalezen')
  }

  if (!event.isPasswordProtected) {
    return true
  }

  if (!password || !event.applicationPasswordHash) {
    return false
  }

  const isMatch = await compare(password, event.applicationPasswordHash)

  return isMatch
}

export async function isApplicationPasswordProtected(
  eventId: string
): Promise<boolean> {
  const event = await prisma.summerJobEvent.findUnique({
    where: { id: eventId },
    select: { isPasswordProtected: true },
  })

  if (!event) {
    throw new InvalidDataError('Ročník nenalezen')
  }

  return event.isPasswordProtected
}
