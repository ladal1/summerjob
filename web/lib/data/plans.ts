import { Plan } from 'lib/prisma/client'
import prisma from 'lib/prisma/connection'
import { ActiveJobNoPlan } from 'lib/types/active-job'
import { PlanComplete, PlanWithJobs } from 'lib/types/plan'
import { cache_getActiveSummerJobEventId } from './cache'
import { InvalidDataError, NoActiveEventError } from './internal-error'
import { databaseWorkerToWorkerComplete } from './workers'

export async function getPlans(): Promise<PlanWithJobs[]> {
  const plans = await prisma.plan.findMany({
    where: {
      summerJobEvent: {
        isActive: true,
      },
    },
    include: {
      jobs: true,
    },
  })

  return plans
}

export async function getCompletePlans(): Promise<PlanComplete[]> {
  const activeEventId = await cache_getActiveSummerJobEventId()
  if (!activeEventId) {
    throw new NoActiveEventError()
  }
  const plans = await prisma.plan.findMany({
    where: {
      summerJobEventId: activeEventId,
    },
    include: {
      jobs: {
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
          rides: {
            include: {
              driver: true,
              car: true,
              job: {
                include: {
                  proposedJob: true,
                },
              },
              passengers: true,
            },
          },
          responsibleWorker: true,
        },
      },
    },
  })
  const plansComplete: PlanComplete[] = []
  for (const plan of plans) {
    const jobs: ActiveJobNoPlan[] = []
    for (const job of plan.jobs) {
      jobs.push({
        ...job,
        workers: job.workers.map(databaseWorkerToWorkerComplete),
      })
    }
    plansComplete.push({ ...plan, jobs })
  }

  return plansComplete
}

export async function getPlanById(id: string): Promise<PlanComplete | null> {
  const activeEventId = await cache_getActiveSummerJobEventId()
  if (!activeEventId) {
    throw new NoActiveEventError()
  }
  const plan = await prisma.plan.findUnique({
    where: { id },
    include: {
      jobs: {
        include: {
          workers: {
            include: {
              cars: {
                where: {
                  deleted: false,
                  forEventId: activeEventId,
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
          rides: {
            include: {
              driver: true,
              car: true,
              job: {
                include: {
                  proposedJob: true,
                },
              },
              passengers: true,
            },
          },
          responsibleWorker: true,
        },
      },
    },
  })
  if (!plan) {
    return null
  }
  const jobs: ActiveJobNoPlan[] = []
  for (const job of plan.jobs) {
    jobs.push({
      ...job,
      workers: job.workers.map(databaseWorkerToWorkerComplete),
    })
  }
  return { ...plan, jobs }
}

export async function createPlan(date: Date): Promise<Plan> {
  const event = await prisma.summerJobEvent.findFirst({
    where: {
      startDate: {
        lte: date,
      },
      endDate: {
        gte: date,
      },
    },
  })
  if (!event) {
    throw new InvalidDataError('No summerjob event found for this date.')
  }
  const plan = await prisma.plan.create({
    data: {
      day: date,
      summerJobEventId: event.id,
    },
  })
  return plan
}

export async function updatePlanById(
  id: string,
  newPlan: Partial<Plan>
): Promise<Plan> {
  const plan = await prisma.plan.update({
    where: { id },
    data: newPlan,
  })
  return plan
}

export async function deletePlan(id: string) {
  await prisma.plan.delete({
    where: { id },
  })
}
