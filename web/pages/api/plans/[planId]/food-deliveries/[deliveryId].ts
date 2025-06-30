import { APIAccessController } from 'lib/api/APIAccessControler'
import { APIMethodHandler } from 'lib/api/MethodHandler'
import { deleteFoodDelivery, getFoodDeliveryWithPlanById } from 'lib/data/food-delivery'
import logger from 'lib/logger/logger'
import { ExtendedSession, Permission } from 'lib/types/auth'
import { APILogEvent } from 'lib/types/logger'
import { NextApiRequest, NextApiResponse } from 'next'

// Response type for GET request
export type CourierDeliveryDetailResponse = Awaited<ReturnType<typeof getFoodDeliveryWithPlanById>>

async function get(
  req: NextApiRequest,
  res: NextApiResponse<CourierDeliveryDetailResponse>
) {
  const deliveryId = req.query.deliveryId as string
  
  const data = await getFoodDeliveryWithPlanById(deliveryId)
  
  if (!data) {
    res.status(404).json(null)
    return
  }
  
  res.status(200).json(data)
}

async function del(
  req: NextApiRequest,
  res: NextApiResponse,
  session: ExtendedSession
) {
  const deliveryId = req.query.deliveryId as string
  const planId = req.query.planId as string
  
  await logger.apiRequest(APILogEvent.FOOD_DELIVERY_DELETE, planId, { deliveryId }, session)
  await deleteFoodDelivery(deliveryId)
  
  res.status(204).end()
}

// No permissions required for GET (courier view), but DELETE requires PLANS permission
export default APIMethodHandler({
  get: get,
  del: APIAccessController([Permission.PLANS], del)
})
