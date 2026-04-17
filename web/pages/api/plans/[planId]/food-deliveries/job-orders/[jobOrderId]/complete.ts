import { APIMethodHandler } from 'lib/api/MethodHandler'
import { updateJobDeliveryStatus } from 'lib/data/food-delivery'
import logger from 'lib/logger/logger'
import { APILogEvent } from 'lib/types/logger'
import { NextApiRequest, NextApiResponse } from 'next'

async function post(req: NextApiRequest, res: NextApiResponse) {
  const jobOrderId = req.query.jobOrderId as string

  const { completed } = req.body as { completed: boolean }
  await logger.apiRequestWithoutSession(
    APILogEvent.FOOD_DELIVERY_COMPLETE,
    jobOrderId,
    { completed }
  )
  const updatedJobOrder = await updateJobDeliveryStatus(jobOrderId, completed)

  res.status(200).json(updatedJobOrder)
}

// Public endpoint — couriers toggle completion via URL without an account.
export default APIMethodHandler({ post })
