import prisma from 'lib/prisma/connection'
import { ArrivalWorker } from 'lib/types/arrival'
import { cache_getActiveSummerJobEventId } from './cache'
import { NoActiveEventError } from './internal-error'

export async function getArrivalsWorkers(): Promise<ArrivalWorker[]> {
  const activeEventId = await cache_getActiveSummerJobEventId()
  if (!activeEventId) {
    throw new NoActiveEventError()
  }

  const workers = await prisma.worker.findMany({
    where: {
      deleted: false,
      availability: {
        some: {
          eventId: activeEventId,
        },
      },
    },
    include: {
      availability: {
        where: {
          eventId: activeEventId,
        },
        take: 1,
      },
      cars: {
        where: {
          deleted: false,
          forEventId: activeEventId,
        },
        select: {
          id: true,
          name: true,
        },
      },
      application: {
        select: {
          birthDate: true,
        },
      },
    },
    orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
  })

  return workers.map(w => ({
    id: w.id,
    firstName: w.firstName,
    lastName: w.lastName,
    phone: w.phone,
    email: w.email,
    age: w.age,
    arrived: w.availability[0]?.arrived ?? false,
    show: w.availability[0]?.show ?? true,
    birthDate: w.application?.birthDate
      ? w.application.birthDate.toISOString()
      : null,
    cars: w.cars,
  }))
}

export async function markWorkerArrived(workerId: string) {
  const activeEventId = await cache_getActiveSummerJobEventId()
  if (!activeEventId) {
    throw new NoActiveEventError()
  }

  return await prisma.workerAvailability.update({
    where: {
      workerId_eventId: {
        workerId,
        eventId: activeEventId,
      },
    },
    data: {
      arrived: true,
    },
  })
}

export async function hideWorker(workerId: string) {
  const activeEventId = await cache_getActiveSummerJobEventId()
  if (!activeEventId) {
    throw new NoActiveEventError()
  }

  return await prisma.workerAvailability.update({
    where: {
      workerId_eventId: {
        workerId,
        eventId: activeEventId,
      },
    },
    data: {
      show: false,
    },
  })
}

export async function unhideWorker(workerId: string) {
  const activeEventId = await cache_getActiveSummerJobEventId()
  if (!activeEventId) {
    throw new NoActiveEventError()
  }

  return await prisma.workerAvailability.update({
    where: {
      workerId_eventId: {
        workerId,
        eventId: activeEventId,
      },
    },
    data: {
      show: true,
    },
  })
}

export async function getWorkersForCsvExport() {
  const activeEventId = await cache_getActiveSummerJobEventId()
  if (!activeEventId) {
    throw new NoActiveEventError()
  }

  return await prisma.worker.findMany({
    where: {
      deleted: false,
      availability: {
        some: {
          eventId: activeEventId,
        },
      },
    },
    include: {
      application: {
        select: {
          birthDate: true,
        },
      },
    },
    orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
  })
}
