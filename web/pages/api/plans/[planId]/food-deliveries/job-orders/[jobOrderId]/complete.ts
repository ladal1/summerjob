import { APIAccessController } from 'lib/api/APIAccessControler'
import { APIMethodHandler } from 'lib/api/MethodHandler'
import { updateJobDeliveryStatus } from 'lib/data/food-delivery'
import logger from 'lib/logger/logger'
import { ExtendedSession } from 'lib/types/auth'
import { APILogEvent } from 'lib/types/logger'
import { NextApiRequest, NextApiResponse } from 'next'

async function post(
  req: NextApiRequest,
  res: NextApiResponse,
  session: ExtendedSession
) {
  const jobOrderId = req.query.jobOrderId as string
  
  // Parse JSON directly from request body
  const { completed } = req.body as { completed: boolean }
  await logger.apiRequest(APILogEvent.FOOD_DELIVERY_COMPLETE, jobOrderId, { completed }, session)
  const updatedJobOrder = await updateJobDeliveryStatus(jobOrderId, completed)
  
  res.status(200).json(updatedJobOrder)
}

export default APIAccessController(
  [], // No permissions required - anyone can mark deliveries as complete
  APIMethodHandler({ post })
)
