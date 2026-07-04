import { APIAccessController } from 'lib/api/APIAccessControler'
import { APIMethodHandler } from 'lib/api/MethodHandler'
import {
  deleteFoodDelivery,
  getFoodDeliveryWithPlanById,
} from 'lib/data/food-delivery'
import logger from 'lib/logger/logger'
import { ExtendedSession, Permission } from 'lib/types/auth'
import { APILogEvent } from 'lib/types/logger'
import { NextApiRequest, NextApiResponse } from 'next'

// Response type for GET request
type CourierDeliveryWithPlan = NonNullable<
  Awaited<ReturnType<typeof getFoodDeliveryWithPlanById>>
>
export type CourierDeliveryDetailResponse = {
  plan: CourierDeliveryWithPlan['plan']
  delivery: CourierDeliveryWithPlan['delivery']
} | null

async function get(
  req: NextApiRequest,
  res: NextApiResponse<CourierDeliveryDetailResponse>
) {
  const planId = req.query.planId as string
  const deliveryId = req.query.deliveryId as string

  const data = await getFoodDeliveryWithPlanById(deliveryId)

  if (!data || data.plan.id !== planId) {
    res.status(404).json(null)
    return
  }

  res.status(200).json({
    plan: data.plan,
    delivery: data.delivery,
  })
}

async function del(
  req: NextApiRequest,
  res: NextApiResponse,
  session: ExtendedSession
) {
  const deliveryId = req.query.deliveryId as string
  const planId = req.query.planId as string

  await logger.apiRequest(
    APILogEvent.FOOD_DELIVERY_DELETE,
    planId,
    { deliveryId },
    session
  )
  await deleteFoodDelivery(deliveryId)

  res.status(204).end()
}

// GET is public — couriers open their delivery via URL without an account.
// DELETE requires PLANS.
export default APIMethodHandler({
  get: get,
  del: APIAccessController([Permission.PLANS], del),
})
