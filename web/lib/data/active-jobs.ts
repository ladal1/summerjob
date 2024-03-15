import prisma from 'lib/prisma/connection'
import {
  ActiveJobComplete,
  ActiveJobCreateData,
  ActiveJobCreateMultipleData,
  ActiveJobUpdateData,
} from 'lib/types/active-job'
import type { Worker, Prisma } from 'lib/prisma/client'
import { cache_getActiveSummerJobEventId } from './cache'
import { InvalidDataError, NoActiveEventError } from './internal-error'
import { databaseWorkerToWorkerComplete } from './workers'

export async function getActiveJobById(
  id: string
): Promise<ActiveJobComplete | null> {
  const activeEventId = await cache_getActiveSummerJobEventId()
  if (!activeEventId) {
    throw new NoActiveEventError()
  }
  const job = await prisma.activeJob.findFirst({
    where: {
      id,
    },
    include: {
      workers: {
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
      },
      proposedJob: {
        include: {
          area: true,
          toolsOnSite: true,
          toolsToTakeWith: true,
        },
      },
      responsibleWorker: true,
      rides: {
        include: {
          car: true,
          driver: true,
          job: {
            include: {
              proposedJob: true,
            },
          },
          passengers: true,
        },
      },
      plan: true,
    },
  })
  if (!job) {
    return null
  }
  const workers = job.workers.map(databaseWorkerToWorkerComplete)
  return { ...job, workers }
}

type ActiveJobSimplified = {
  id: string
  responsibleWorkerId: string | null
  workers: {
    id: string
  }[]
}

/**
 * Removes a worker from a job and all rides associated with the job.
 * If the worker is the responsible worker, the responsible worker is set to null.
 * If the worker is a driver of a ride, the ride is deleted.
 * @param workerId ID of the worker to remove
 * @param jobId ID of the job to remove the worker from
 * @param tx Prisma transaction client
 */
async function removeWorkerFromJob(
  workerId: string,
  job: ActiveJobSimplified,
  tx: Prisma.TransactionClient
) {
  const newResponsiblePersonId =
    job.responsibleWorkerId === workerId ? null : job.responsibleWorkerId
  const updatedJob = await tx.activeJob.update({
    where: {
      id: job.id,
    },
    data: {
      responsibleWorkerId: newResponsiblePersonId,
      workers: {
        disconnect: {
          id: workerId,
        },
      },
      rides: {
        deleteMany: {
          driverId: workerId,
        },
      },
    },
    select: {
      plan: {
        select: {
          id: true,
        },
      },
    },
  })

  // Remove the worker from all rides of jobs in this day that they are a passenger of
  const jobsInPlan = await tx.activeJob.findMany({
    where: { plan: { id: updatedJob.plan.id } },
    include: {
      rides: {
        select: {
          id: true,
          passengers: true,
        },
      },
    },
  })

  for (const activeJob of jobsInPlan) {
    for (const ride of activeJob.rides) {
      if (ride.passengers.some(p => p.id === workerId)) {
        await tx.ride.update({
          where: {
            id: ride.id,
          },
          data: {
            passengers: {
              disconnect: {
                id: workerId,
              },
            },
          },
        })
      }
    }
  }
}

function getJobsWithWorkers(
  workerIds: string[],
  planId: string,
  tx: Prisma.TransactionClient
) {
  return tx.activeJob.findMany({
    where: {
      planId,
      workers: {
        some: {
          id: {
            in: workerIds,
          },
        },
      },
    },
    select: {
      id: true,
      responsibleWorkerId: true,
      workers: {
        select: {
          id: true,
        },
      },
    },
  })
}

function getActiveJobDetailsById(
  id: string | undefined,
  tx: Prisma.TransactionClient
) {
  return tx.activeJob.findFirst({
    where: {
      id,
    },
    include: {
      workers: {
        select: {
          id: true,
        },
      },
      rides: {
        include: {
          passengers: {
            select: {
              id: true,
            },
          },
        },
      },
    },
  })
}

export async function updateActiveJob(id: string, job: ActiveJobUpdateData) {
  const { completed, proposedJob, responsibleWorkerId, workerIds } = job
  return await prisma.$transaction(async tx => {
    const existingActiveJob = await getActiveJobDetailsById(id, tx)
    if (!existingActiveJob) {
      throw new Error('Active job not found')
    }
    let workersCommand = {}

    // Remove new workers from other active jobs
    const currentWorkerIds = existingActiveJob.workers.map(w => w.id)
    const workersToAdd = workerIds?.filter(id => !currentWorkerIds.includes(id))
    if (workersToAdd && workersToAdd.length > 0) {
      const previousJobsWithWorkers = await getJobsWithWorkers(
        workersToAdd,
        existingActiveJob?.planId,
        tx
      )
      for (const previousJob of previousJobsWithWorkers) {
        if (previousJob.id !== id) {
          for (const workerId of workersToAdd) {
            if (previousJob.workers.some(w => w.id === workerId)) {
              await removeWorkerFromJob(workerId, previousJob, tx)
            }
          }
        }
      }
    }

    // Remove old workers from this job if needed
    let workersToRemove: string[] = []
    if (workerIds) {
      workersToRemove = currentWorkerIds.filter(id => !workerIds?.includes(id))
      for (const workerId of workersToRemove) {
        await removeWorkerFromJob(workerId, existingActiveJob, tx)
      }
    }

    const addedWorkers = workersToAdd?.length ?? 0 > 0
    const removedWorkers = workersToRemove.length > 0
    if (workerIds && (addedWorkers || removedWorkers)) {
      workersCommand = {
        workers: {
          connect: workersToAdd?.map(id => ({ id })) ?? [],
          disconnect: workersToRemove.map(id => ({ id })),
        },
      }
    }

    // update proposed job
    await tx.proposedJob.update({
      where: {
        id: existingActiveJob.proposedJobId,
      },
      data: {
        name: proposedJob?.name,
        publicDescription: proposedJob?.publicDescription,
        privateDescription: proposedJob?.privateDescription,
      },
    })

    // update active job
    const activeJob = await tx.activeJob.update({
      where: {
        id,
      },
      data: {
        completed,
        responsibleWorkerId,
        ...workersCommand,
      },
    })

    return activeJob
  })
}

export async function createActiveJob(job: ActiveJobCreateData) {
  const { proposedJobId, planId } = job
  const activeJob = await prisma.$transaction(async tx => {
    const existingActiveJob = await tx.activeJob.findFirst({
      where: {
        proposedJobId,
        planId,
      },
    })
    if (existingActiveJob) {
      throw new InvalidDataError('Active job already exists in this plan')
    }
    const activeJob = await tx.activeJob.create({
      data: {
        planId,
        proposedJobId,
      },
    })
    return activeJob
  })

  return activeJob
}

export async function createActiveJobs(data: ActiveJobCreateMultipleData) {
  const proposedJobIds = data.jobs.map(j => j.proposedJobId)
  const activeJobs = await prisma.$transaction(async tx => {
    const existingActiveJobs = await tx.activeJob.findMany({
      where: {
        proposedJobId: {
          in: proposedJobIds,
        },
        planId: data.planId,
      },
    })
    if (existingActiveJobs.length > 0) {
      throw new Error('Active jobs already exist in this plan')
    }
    const activeJobs = await tx.activeJob.createMany({
      data: data.jobs.map(job => ({
        planId: data.planId,
        proposedJobId: job.proposedJobId,
      })),
    })
    return activeJobs
  })

  return activeJobs
}

export function deleteActiveJob(id: string) {
  return prisma.activeJob.delete({
    where: {
      id,
    },
  })
}
