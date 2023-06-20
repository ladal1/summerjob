import { PrismaClient } from '../../../prisma/client'
import { ActiveJobNoPlan, PlanComplete } from '../DataSource'
import { databaseWorkerToWorkerComplete } from './worker'

export async function getPlanById(
  id: string,
  prisma: PrismaClient
): Promise<PlanComplete | null> {
  const simplePlan = await prisma.plan.findUnique({
    where: { id },
  })
  if (!simplePlan) {
    return null
  }
  const eventId = simplePlan.summerJobEventId
  const plan = await prisma.plan.findUnique({
    where: { id },
    include: {
      jobs: {
        include: {
          workers: {
            include: {
              cars: true,
              availability: {
                where: {
                  event: {
                    id: eventId,
                  },
                },
              },
            },
          },
          proposedJob: {
            include: {
              area: true,
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
