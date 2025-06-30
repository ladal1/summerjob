import { APIAccessController } from 'lib/api/APIAccessControler'
import { APIMethodHandler } from 'lib/api/MethodHandler'
import { getFoodDeliveriesWithPlanByPlanId } from 'lib/data/food-delivery'
import { NextApiRequest, NextApiResponse } from 'next'

// Minimal types for courier delivery view
export type CourierDeliveryWorker = {
  id: string
  firstName: string
  lastName: string
  phone: string
  age: number | null
  foodAllergies: string[]
}

export type CourierDeliveryJob = {
  id: string
  workers: CourierDeliveryWorker[]
  proposedJob: {
    id: string
    name: string
    address: string
    coordinates: [number, number] | null
    hasFood: boolean
    area: {
      id: string
      name: string
    } | null
  }
  responsibleWorker: {
    id: string
    firstName: string
    lastName: string
    phone: string
  } | null
  completed: boolean
}

export type CourierDeliveryPlan = {
  id: string
  day: Date
  jobs: CourierDeliveryJob[]
}

export type CourierDeliveryData = {
  id: string
  courierNum: number
  jobs: Array<{
    id: string
    activeJobId: string
    order: number
    completed: boolean
  }>
}

export type CourierDeliveryAPIGetResponse = {
  plan: CourierDeliveryPlan
  deliveries: CourierDeliveryData[]
}

async function get(
  req: NextApiRequest,
  res: NextApiResponse<CourierDeliveryAPIGetResponse>
) {
  const planId = req.query.planId as string
  const rawData = await getFoodDeliveriesWithPlanByPlanId(planId)
  
  if (!rawData) {
    res.status(404).end()
    return
  }
  
  // Transform the data to match the expected types
  const transformedData: CourierDeliveryAPIGetResponse = {
    plan: {
      id: rawData.plan.id,
      day: rawData.plan.day,
      jobs: rawData.plan.jobs.map(job => ({
        id: job.id,
        workers: job.workers.map(worker => ({
          id: worker.id,
          firstName: worker.firstName,
          lastName: worker.lastName,
          phone: worker.phone,
          age: worker.age,
          foodAllergies: worker.foodAllergies
        })),
        proposedJob: {
          id: job.proposedJob.id,
          name: job.proposedJob.name,
          address: job.proposedJob.address,
          coordinates: job.proposedJob.coordinates && job.proposedJob.coordinates.length >= 2 
            ? [job.proposedJob.coordinates[0], job.proposedJob.coordinates[1]] as [number, number]
            : null,
          hasFood: job.proposedJob.hasFood,
          area: job.proposedJob.area ? {
            id: job.proposedJob.area.id,
            name: job.proposedJob.area.name
          } : null
        },
        responsibleWorker: job.responsibleWorker ? {
          id: job.responsibleWorker.id,
          firstName: job.responsibleWorker.firstName,
          lastName: job.responsibleWorker.lastName,
          phone: job.responsibleWorker.phone
        } : null,
        completed: false // This comes from the delivery jobs, not the plan jobs
      }))
    },
    deliveries: rawData.deliveries
  }
  
  res.status(200).json(transformedData)
}

export default APIAccessController(
  [], // No permissions required for courier delivery viewing
  APIMethodHandler({ get })
)
