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
  const data = await getFoodDeliveriesWithPlanByPlanId(planId)
  
  if (!data) {
    res.status(404).end()
    return
  }
  
  res.status(200).json(data)
}

export default APIAccessController(
  [], // No permissions required for courier delivery viewing
  APIMethodHandler({ get })
)
