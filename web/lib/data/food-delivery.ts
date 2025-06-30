import { cache_getActiveSummerJobEventId } from './cache'
import { NoActiveEventError } from './internal-error'
import prisma from 'lib/prisma/connection'

export interface FoodDeliveryCreateData {
  courierNum: number
  planId: string
  jobs?: Array<{
    activeJobId: string
    order: number
  }>
}

export interface FoodDeliveryUpdateData {
  jobs: Array<{
    activeJobId: string
    order: number
    completed?: boolean
  }>
}

export async function getFoodDeliveriesByPlanId(planId: string) {
  const activeEventId = await cache_getActiveSummerJobEventId()
  if (!activeEventId) {
    throw new NoActiveEventError()
  }

  const deliveries = await prisma.foodDelivery.findMany({
    where: {
      planId: planId,
    },
    include: {
      jobs: {
        include: {
          activeJob: {
            include: {
              proposedJob: {
                include: {
                  area: true,
                },
              },
              workers: {
                include: {
                  availability: {
                    where: {
                      eventId: activeEventId,
                    },
                    take: 1,
                  },
                },
              },
              responsibleWorker: true,
            },
          },
        },
        orderBy: {
          order: 'asc',
        },
      },
    },
    orderBy: {
      courierNum: 'asc',
    },
  })

  return deliveries
}

export async function createFoodDelivery(data: FoodDeliveryCreateData) {
  const delivery = await prisma.foodDelivery.create({
    data: {
      courierNum: data.courierNum,
      planId: data.planId,
      jobs: {
        create: (data.jobs || []).map(job => ({
          activeJobId: job.activeJobId,
          order: job.order,
        })),
      },
    },
    include: {
      jobs: {
        include: {
          activeJob: {
            include: {
              proposedJob: {
                include: {
                  area: true,
                },
              },
              workers: true,
              responsibleWorker: true,
            },
          },
        },
        orderBy: {
          order: 'asc',
        },
      },
    },
  })

  return delivery
}

export async function updateFoodDelivery(deliveryId: string, data: FoodDeliveryUpdateData) {
  // Delete existing job orders for this delivery
  await prisma.foodDeliveryJobOrder.deleteMany({
    where: {
      foodDeliveryId: deliveryId,
    },
  })

  // Create new job orders
  const delivery = await prisma.foodDelivery.update({
    where: {
      id: deliveryId,
    },
    data: {
      jobs: {
        create: (data.jobs || []).map(job => ({
          activeJobId: job.activeJobId,
          order: job.order,
          completed: job.completed || false,
        })),
      },
    },
    include: {
      jobs: {
        include: {
          activeJob: {
            include: {
              proposedJob: {
                include: {
                  area: true,
                },
              },
              workers: true,
              responsibleWorker: true,
            },
          },
        },
        orderBy: {
          order: 'asc',
        },
      },
    },
  })

  return delivery
}

export async function getFoodDeliveryById(deliveryId: string) {
  const activeEventId = await cache_getActiveSummerJobEventId()
  if (!activeEventId) {
    throw new NoActiveEventError()
  }

  const delivery = await prisma.foodDelivery.findUnique({
    where: {
      id: deliveryId,
    },
    include: {
      jobs: {
        include: {
          activeJob: {
            include: {
              proposedJob: {
                include: {
                  area: true,
                },
              },
              workers: {
                include: {
                  availability: {
                    where: {
                      eventId: activeEventId,
                    },
                    take: 1,
                  },
                },
              },
              responsibleWorker: true,
            },
          },
        },
        orderBy: {
          order: 'asc',
        },
      },
    },
  })

  return delivery
}

export async function getFoodDeliveriesWithPlanByPlanId(planId: string) {
  const activeEventId = await cache_getActiveSummerJobEventId()
  if (!activeEventId) {
    throw new NoActiveEventError()
  }

  // Get plan data
  const plan = await prisma.plan.findUnique({
    where: {
      id: planId,
    },
    include: {
      jobs: {
        include: {
          proposedJob: {
            include: {
              area: true,
            },
          },
          workers: {
            include: {
              availability: {
                where: {
                  eventId: activeEventId,
                },
                take: 1,
              },
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

  // Get food deliveries for this plan
  const deliveries = await getFoodDeliveriesByPlanId(planId)

  return {
    plan,
    deliveries,
  }
}

export async function getFoodDeliveryWithPlanById(deliveryId: string) {
  const activeEventId = await cache_getActiveSummerJobEventId()
  if (!activeEventId) {
    throw new NoActiveEventError()
  }

  // Get the delivery first to find the plan
  const delivery = await getFoodDeliveryById(deliveryId)
  if (!delivery) {
    return null
  }

  // Get the plan data
  const plan = await prisma.plan.findUnique({
    where: {
      id: delivery.planId,
    },
    include: {
      jobs: {
        include: {
          proposedJob: {
            include: {
              area: true,
            },
          },
          workers: {
            include: {
              availability: {
                where: {
                  eventId: activeEventId,
                },
                take: 1,
              },
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

  // Get all deliveries for this plan (for context)
  const allDeliveries = await getFoodDeliveriesByPlanId(delivery.planId)

  return {
    plan,
    delivery,
    allDeliveries,
  }
}

export async function deleteFoodDelivery(deliveryId: string) {
  await prisma.foodDelivery.delete({
    where: {
      id: deliveryId,
    },
  })
}

export async function updateJobDeliveryStatus(jobOrderId: string, completed: boolean) {
  const jobOrder = await prisma.foodDeliveryJobOrder.update({
    where: {
      id: jobOrderId,
    },
    data: {
      completed: completed,
      completedAt: completed ? new Date() : null,
    },
  })

  return jobOrder
}

export async function replaceAllFoodDeliveries(planId: string, deliveries: FoodDeliveryCreateData[]) {
  const activeEventId = await cache_getActiveSummerJobEventId()
  if (!activeEventId) {
    throw new Error('No active summer job event found')
  }

  return await prisma.$transaction(async (tx) => {
    // Delete all existing food deliveries for this plan
    await tx.foodDelivery.deleteMany({
      where: {
        planId: planId,
      },
    })

    // Create new deliveries
    const createdDeliveries = await Promise.all(
      deliveries.map(data =>
        tx.foodDelivery.create({
          data: {
            courierNum: data.courierNum,
            planId: data.planId,
            jobs: {
              create: (data.jobs || []).map(job => ({
                activeJobId: job.activeJobId,
                order: job.order,
              })),
            },
          },
          include: {
            jobs: {
              include: {
                activeJob: {
                  include: {
                    proposedJob: {
                      include: {
                        area: true,
                      },
                    },
                    workers: {
                      include: {
                        availability: {
                          where: {
                            eventId: activeEventId,
                          },
                          take: 1,
                        },
                      },
                    },
                    responsibleWorker: true,
                  },
                },
              },
              orderBy: {
                order: 'asc',
              },
            },
          },
        })
      )
    )

    return createdDeliveries
  })
}
