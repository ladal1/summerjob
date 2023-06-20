import { Plan, PrismaClient } from '../../prisma/client'
import { DataSource, JobToBePlanned } from './DataSource'
import { getPlanById } from './prisma/plan'
import { getWorkersWithoutJob } from './prisma/worker'

const prisma = new PrismaClient()

export class PrismaDataSource implements DataSource {
  getPlan(planId: string) {
    return getPlanById(planId, prisma)
  }

  getWorkersWithoutJob(plan: Plan) {
    return getWorkersWithoutJob(plan, prisma)
  }

  async setPlannedJobs(planId: string, jobs: JobToBePlanned[]) {
    console.log(' [x] Saving %d jobs', jobs.length)
    await prisma.$transaction(async (tx) => {
      await tx.activeJob.deleteMany({
        where: {
          planId,
        },
      })
      for (const job of jobs) {
        const createdJob = await tx.activeJob.create({
          data: {
            planId,
            proposedJobId: job.proposedJobId,
            responsibleWorkerId: job.responsibleWorkerId,
            privateDescription: job.privateDescription,
            publicDescription: job.publicDescription,
            workers: {
              connect: job.workerIds.map((id) => ({ id })),
            },
          },
        })
        for (const ride of job.rides) {
          await tx.ride.create({
            data: {
              driverId: ride.driverId,
              carId: ride.carId,
              jobId: createdJob.id,
              passengers: {
                connect: ride.passengerIds.map((id) => ({ id })),
              },
            },
          })
        }
      }
    })
  }
}
