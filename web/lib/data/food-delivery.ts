import { cache_getActiveSummerJobEventId } from './cache'
import { NoActiveEventError } from './internal-error'
import prisma from 'lib/prisma/connection'

export interface FoodDeliveryJobInput {
  activeJobId: string
  order: number
  completed?: boolean
  recipientIds?: string[]
}

export interface FoodDeliveryCreateData {
  courierNum: number
  planId: string
  notes?: string | null
  jobs?: FoodDeliveryJobInput[]
}

export interface FoodDeliveryUpdateData {
  jobs: FoodDeliveryJobInput[]
}

const deliveryInclude = (activeEventId: string) => ({
  jobs: {
    include: {
      activeJob: {
        include: {
          proposedJob: { include: { area: true } },
          workers: {
            include: {
              availability: {
                where: { eventId: activeEventId },
                take: 1,
              },
              foodAllergies: true,
            },
          },
          responsibleWorker: true,
        },
      },
      recipients: true,
    },
    orderBy: { order: 'asc' as const },
  },
})

export async function getFoodDeliveriesByPlanId(planId: string) {
  const activeEventId = await cache_getActiveSummerJobEventId()
  if (!activeEventId) throw new NoActiveEventError()

  return prisma.foodDelivery.findMany({
    where: { planId },
    include: deliveryInclude(activeEventId),
    orderBy: { courierNum: 'asc' },
  })
}

export async function getFoodDeliveryById(deliveryId: string) {
  const activeEventId = await cache_getActiveSummerJobEventId()
  if (!activeEventId) throw new NoActiveEventError()

  return prisma.foodDelivery.findUnique({
    where: { id: deliveryId },
    include: deliveryInclude(activeEventId),
  })
}

export async function createFoodDelivery(data: FoodDeliveryCreateData) {
  const activeEventId = await cache_getActiveSummerJobEventId()
  if (!activeEventId) throw new NoActiveEventError()

  return prisma.foodDelivery.create({
    data: {
      courierNum: data.courierNum,
      planId: data.planId,
      notes: data.notes ?? null,
      jobs: {
        create: (data.jobs || []).map(job => ({
          activeJobId: job.activeJobId,
          order: job.order,
          completed: job.completed ?? false,
          recipients: job.recipientIds?.length
            ? { connect: job.recipientIds.map(id => ({ id })) }
            : undefined,
        })),
      },
    },
    include: deliveryInclude(activeEventId),
  })
}

export async function getFoodDeliveriesWithPlanByPlanId(planId: string) {
  const activeEventId = await cache_getActiveSummerJobEventId()
  if (!activeEventId) throw new NoActiveEventError()

  const plan = await prisma.plan.findUnique({
    where: { id: planId },
    include: {
      jobs: {
        include: {
          proposedJob: { include: { area: true } },
          workers: {
            include: {
              availability: {
                where: { eventId: activeEventId },
                take: 1,
              },
              foodAllergies: true,
            },
          },
          responsibleWorker: true,
        },
      },
    },
  })

  if (!plan) return null

  const deliveries = await getFoodDeliveriesByPlanId(planId)
  return { plan, deliveries }
}

export async function getFoodDeliveryWithPlanById(deliveryId: string) {
  const activeEventId = await cache_getActiveSummerJobEventId()
  if (!activeEventId) throw new NoActiveEventError()

  const delivery = await getFoodDeliveryById(deliveryId)
  if (!delivery) return null

  const plan = await prisma.plan.findUnique({
    where: { id: delivery.planId },
    include: {
      jobs: {
        include: {
          proposedJob: { include: { area: true } },
          workers: {
            include: {
              availability: {
                where: { eventId: activeEventId },
                take: 1,
              },
              foodAllergies: true,
            },
          },
          responsibleWorker: true,
        },
      },
    },
  })

  if (!plan) return null

  const allDeliveries = await getFoodDeliveriesByPlanId(delivery.planId)
  return { plan, delivery, allDeliveries }
}

export async function deleteFoodDelivery(deliveryId: string) {
  await prisma.foodDelivery.delete({ where: { id: deliveryId } })
}

export async function updateJobDeliveryStatus(
  jobOrderId: string,
  completed: boolean
) {
  return prisma.foodDeliveryJobOrder.update({
    where: { id: jobOrderId },
    data: {
      completed,
      completedAt: completed ? new Date() : null,
    },
  })
}

// Upsert-based replace: preserves FoodDelivery.id (so courier URLs stay stable
// across saves) and FoodDeliveryJobOrder.id + completed state for jobs that
// stay assigned to the same courier.
export async function replaceAllFoodDeliveries(
  planId: string,
  deliveries: FoodDeliveryCreateData[]
) {
  const activeEventId = await cache_getActiveSummerJobEventId()
  if (!activeEventId) throw new NoActiveEventError()

  return prisma.$transaction(async tx => {
    const incomingCourierNums = deliveries.map(d => d.courierNum)

    // Drop couriers not in the new set (cascades job orders + recipient links).
    await tx.foodDelivery.deleteMany({
      where: { planId, courierNum: { notIn: incomingCourierNums } },
    })

    for (const data of deliveries) {
      const delivery = await tx.foodDelivery.upsert({
        where: {
          courierNum_planId: { courierNum: data.courierNum, planId },
        },
        create: {
          courierNum: data.courierNum,
          planId,
          notes: data.notes ?? null,
        },
        update: { notes: data.notes ?? null },
      })

      const incomingJobs = data.jobs ?? []
      const incomingJobIds = incomingJobs.map(j => j.activeJobId)

      // Drop job orders no longer assigned to this courier.
      await tx.foodDeliveryJobOrder.deleteMany({
        where: {
          foodDeliveryId: delivery.id,
          activeJobId: { notIn: incomingJobIds },
        },
      })

      // Reordering would transiently violate @@unique([foodDeliveryId, order]).
      // Flip existing orders to negatives first so the upsert below can freely
      // assign new positive orders without colliding with old rows.
      if (incomingJobs.length > 0) {
        await tx.$executeRaw`
          UPDATE "FoodDeliveryJobOrder"
          SET "order" = -"order" - 1
          WHERE "foodDeliveryId" = ${delivery.id}
        `
      }

      for (const job of incomingJobs) {
        await tx.foodDeliveryJobOrder.upsert({
          where: {
            foodDeliveryId_activeJobId: {
              foodDeliveryId: delivery.id,
              activeJobId: job.activeJobId,
            },
          },
          create: {
            foodDeliveryId: delivery.id,
            activeJobId: job.activeJobId,
            order: job.order,
            completed: job.completed ?? false,
            recipients: job.recipientIds?.length
              ? { connect: job.recipientIds.map(id => ({ id })) }
              : undefined,
          },
          update: {
            order: job.order,
            // `completed` intentionally not touched — preserve courier-marked state.
            recipients: {
              set: (job.recipientIds ?? []).map(id => ({ id })),
            },
          },
        })
      }
    }

    return tx.foodDelivery.findMany({
      where: { planId },
      include: deliveryInclude(activeEventId),
      orderBy: { courierNum: 'asc' },
    })
  })
}
