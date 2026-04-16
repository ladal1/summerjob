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

export async function replaceAllFoodDeliveries(
  planId: string,
  deliveries: FoodDeliveryCreateData[]
) {
  const activeEventId = await cache_getActiveSummerJobEventId()
  if (!activeEventId) throw new NoActiveEventError()

  return prisma.$transaction(async tx => {
    await tx.foodDelivery.deleteMany({ where: { planId } })

    return Promise.all(
      deliveries.map(data =>
        tx.foodDelivery.create({
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
      )
    )
  })
}
