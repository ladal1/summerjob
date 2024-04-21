import {
  deleteFile,
  getUploadDirForImagesForCurrentEvent,
  renameFile,
  updatePhotoPathByNewFilename,
} from 'lib/api/fileManager'
import { getPhotoPath } from 'lib/api/parse-form'
import { PrismaClient, Worker, WorkerAvailability } from 'lib/prisma/client'
import prisma from 'lib/prisma/connection'
import { PrismaTransactionClient } from 'lib/types/prisma'
import {
  WorkerComplete,
  WorkerCreateData,
  WorkerUpdateData,
  WorkersCreateData,
} from 'lib/types/worker'
import { cache_getActiveSummerJobEventId } from './cache'
import { NoActiveEventError, WorkerAlreadyExistsError } from './internal-error'
import { deleteUserSessions } from './users'
import formidable from 'formidable'

export async function getWorkers(
  withoutJobInPlanId: string | undefined = undefined
): Promise<WorkerComplete[]> {
  const users = await prisma.worker.findMany({
    where: {
      deleted: false,
      availability: {
        some: {
          event: {
            isActive: true,
          },
        },
      },
      ...(withoutJobInPlanId && {
        NOT: {
          jobs: {
            some: {
              planId: withoutJobInPlanId,
            },
          },
        },
      }),
    },
    include: {
      cars: {
        where: {
          deleted: false,
        },
      },
      availability: {
        where: {
          event: {
            isActive: true,
          },
        },
        take: 1,
      },
    },
    orderBy: [
      {
        firstName: 'asc',
      },
      {
        lastName: 'asc',
      },
    ],
  })
  // TODO: Remove this when the prisma client findMany is fixed
  const correctType = users as Parameters<
    typeof databaseWorkerToWorkerComplete
  >[0][]
  const res = correctType.map(databaseWorkerToWorkerComplete)
  return res
}

export async function getWorkerPhotoPathById(
  id: string,
  prismaClient: PrismaClient | PrismaTransactionClient = prisma
): Promise<string | null> {
  const activeEventId = await cache_getActiveSummerJobEventId()
  if (!activeEventId) {
    throw new NoActiveEventError()
  }
  const worker = await prismaClient.worker.findUnique({
    where: {
      id: id,
    },
    select: {
      photoPath: true,
    },
  })
  if (!worker || !worker.photoPath) {
    return null
  }
  const uploadDirAbsolutePath = await getUploadDirForImagesForCurrentEvent()
  return uploadDirAbsolutePath + worker.photoPath
}

export async function getWorkerById(
  id: string
): Promise<WorkerComplete | null> {
  const activeEventId = await cache_getActiveSummerJobEventId()
  if (!activeEventId) {
    throw new NoActiveEventError()
  }
  const user = await prisma.worker.findUnique({
    where: {
      id,
    },
    include: {
      cars: {
        where: {
          deleted: false,
        },
      },
      availability: {
        where: {
          eventId: activeEventId,
        },
        take: 1,
      },
    },
  })
  if (!user) {
    return null
  }
  // Only return availability for the active event
  return databaseWorkerToWorkerComplete(user)
}

export function databaseWorkerToWorkerComplete(
  worker: Omit<WorkerComplete, 'availability'> & {
    availability: WorkerAvailability[]
  }
): WorkerComplete {
  const { availability, ...rest } = worker
  return { ...rest, availability: availability[0] }
}

export async function deleteWorker(id: string) {
  await prisma.$transaction(async tx => {
    // Delete file from disk if there is path to it
    const workerPhotoPath = await getWorkerPhotoPathById(id)
    if (workerPhotoPath) {
      await deleteFile(workerPhotoPath) // delete original image if it exists
    }
    // Check if the worker has ever been assigned to a job
    // If not, we can just delete them
    const worker = await tx.worker.findUnique({
      where: { id },
      include: {
        jobs: true,
        permissions: true,
      },
    })
    if (!worker) {
      return
    }
    await deleteUserSessions(worker.email)
    if (worker.jobs.length === 0) {
      await tx.worker.delete({
        where: {
          id,
        },
      })
      await tx.workerPermissions.delete({
        where: {
          id: worker.permissions.id,
        },
      })
      return
    }
    // If the worker has been assigned to a job, we cannot delete them from the database as it would break the job history
    // Instead, we anonymize them
    await prisma.worker.update({
      where: {
        id,
      },
      data: {
        firstName: 'Deleted',
        lastName: 'Worker',
        email: `${id}@deleted.xyz`,
        phone: '00000000',
        allergies: {
          set: [],
        },
        skills: {
          set: [],
        },
        availability: {
          updateMany: {
            where: {},
            data: {
              workDays: [],
              adorationDays: [],
            },
          },
        },
        cars: {
          updateMany: {
            where: {},
            data: {
              deleted: true,
              description: 'Deleted',
              name: 'Deleted Car',
            },
          },
        },
        photoPath: null,
        deleted: true,
        blocked: true,
        permissions: {
          update: {
            permissions: [],
          },
        },
      },
    })
  })
}

export async function createWorkers(data: WorkersCreateData) {
  const activeEventId = await cache_getActiveSummerJobEventId()
  if (!activeEventId) {
    throw new NoActiveEventError()
  }
  const workers = await prisma.$transaction(async tx => {
    const workers: Worker[] = []
    for (const worker of data.workers) {
      workers.push(await createWorker(worker, undefined, tx))
    }
    return workers
  })
  return workers
}

async function internal_createWorker(
  activeEventId: string | undefined,
  data: WorkerCreateData,
  file: formidable.File | formidable.File[] | undefined = undefined,
  prismaClient: PrismaTransactionClient = prisma
) {
  const worker = await prismaClient.worker.upsert({
    where: {
      email: data.email.toLowerCase(),
    },
    update: {
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      allergies: {
        set: data.allergyIds,
      },
      age: data.age,
      skills: {
        set: data.skills,
      },
      blocked: false,
      availability: {
        create: {
          workDays: data.availability.workDays,
          adorationDays: data.availability.adorationDays,
          event: {
            connect: {
              id: activeEventId,
            },
          },
        },
      },
    },
    create: {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email.toLowerCase(),
      phone: data.phone,
      isStrong: data.strong,
      isTeam: data.team,
      note: data.note,
      allergies: {
        set: data.allergyIds,
      },
      age: data.age,
      skills: {
        set: data.skills,
      },
      availability: {
        create: {
          workDays: data.availability?.workDays ?? [],
          adorationDays: data.availability?.adorationDays ?? [],
          event: {
            connect: {
              id: activeEventId,
            },
          },
        },
      },
      permissions: {
        create: {
          permissions: [],
        },
      },
    },
  })
  // Rename photo file and update worker with new photo path to it.
  if (file) {
    const temporaryPhotoPath = getPhotoPath(file) // update photoPath
    const photoPath =
      updatePhotoPathByNewFilename(temporaryPhotoPath, worker.id) ?? ''
    await renameFile(temporaryPhotoPath, photoPath)
    // Save only relative part of photoPath
    const uploadDirAbsolutePath = await getUploadDirForImagesForCurrentEvent()
    const relativePath = photoPath.substring(uploadDirAbsolutePath.length)
    const updatedWorker = await internal_updateWorker(worker.id, {
      photoPath: relativePath,
    })
    return { ...worker, ...updatedWorker }
  }
  return worker
}

/**
 * Creates a new worker in the currently active event or updates an existing worker from previous events, assigning them to the currently active event
 * @param data Worker data
 * @param prismaClient If this is called from a transaction, the transaction client should be passed here
 * @returns New or updated worker
 */
export async function createWorker(
  data: WorkerCreateData,
  file: formidable.File | formidable.File[] | undefined = undefined,
  prismaClient: PrismaClient | PrismaTransactionClient = prisma
) {
  const activeEventId = await cache_getActiveSummerJobEventId()
  if (!activeEventId) {
    throw new NoActiveEventError()
  }

  const existingUser = await prismaClient.worker.findFirst({
    where: {
      email: data.email.toLowerCase(),
      availability: {
        some: {
          eventId: activeEventId,
        },
      },
    },
  })

  if (existingUser) {
    throw new WorkerAlreadyExistsError(existingUser.email)
  }

  if (prismaClient instanceof PrismaClient) {
    return await prismaClient.$transaction(
      async tx => await internal_createWorker(activeEventId, data, file, tx)
    )
  }
  return await internal_createWorker(activeEventId, data, file, prismaClient)
}

export async function updateWorker(
  id: string,
  data: WorkerUpdateData,
  file: formidable.File | formidable.File[] | undefined = undefined
) {
  if (!data.email) {
    return await internal_updateWorker(id, data, file)
  }
  data.email = data.email.toLowerCase()
  return await prisma.$transaction(async tx => {
    const user = await internal_updateWorker(id, data, file, tx)
    if (!user) return null
    await deleteUserSessions(user.email, tx)
    return user
  })
}

export async function internal_updateWorker(
  id: string,
  data: WorkerUpdateData,
  file: formidable.File | formidable.File[] | undefined = undefined,
  prismaClient: PrismaTransactionClient = prisma
) {
  const activeEventId = await cache_getActiveSummerJobEventId()
  if (data.availability) {
    if (!activeEventId) {
      throw new NoActiveEventError()
    }
  }

  const allergyUpdate = data.allergyIds
    ? { allergies: { set: data.allergyIds } }
    : {}

  const skillsUpdate = data.skills ? { skills: { set: data.skills } } : {}

  // Get photoPath from uploaded photoFile. If there was uploaded image for this user, it will be deleted.
  if (file) {
    const photoPath = getPhotoPath(file) // update photoPath
    const workerPhotoPath = await getWorkerPhotoPathById(id, prismaClient)
    if (workerPhotoPath && workerPhotoPath !== photoPath) {
      // if original image exists and it is named differently (meaning it wasn't replaced already by parseFormWithImages) delete it
      await deleteFile(workerPhotoPath) // delete original image if necessary
    }
    // Save only relative part of photoPath
    const uploadDirAbsolutePath = await getUploadDirForImagesForCurrentEvent()
    const relativePath = photoPath.substring(uploadDirAbsolutePath.length)
    data.photoPath = relativePath
  } else if (data.photoFileRemoved) {
    // If original file was deleted on client and was not replaced (it is not in files) file should be deleted.
    const workerPhotoPath = await getWorkerPhotoPathById(id, prismaClient)
    if (workerPhotoPath) {
      await deleteFile(workerPhotoPath) // delete original image
    }
    data.photoPath = ''
  }

  return await prismaClient.worker.update({
    where: {
      id,
    },
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      isStrong: data.strong,
      isTeam: data.team,
      photoPath: data.photoPath,
      note: data.note,
      ...allergyUpdate,
      age: data.age,
      ...skillsUpdate,
      availability: {
        update: {
          where: {
            workerId_eventId: {
              workerId: id,
              eventId: activeEventId ?? '',
            },
          },
          data: {
            workDays: data.availability?.workDays,
            adorationDays: data.availability?.adorationDays,
          },
        },
      },
    },
  })
}
