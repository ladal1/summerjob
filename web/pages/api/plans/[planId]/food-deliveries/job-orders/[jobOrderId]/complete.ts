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
  const planId = req.query.planId as string
  const jobOrderId = req.query.jobOrderId as string

  const { completed } = req.body as { completed?: unknown }
  if (typeof completed !== 'boolean') {
    res.status(400).json({ error: 'Invalid request body' })
    return
  }

  const updatedJobOrder = await updateJobDeliveryStatus(
    planId,
    jobOrderId,
    completed
  )
  if (!updatedJobOrder) {
    res.status(404).json({ error: 'Job order not found for this plan' })
    return
  }

  await logger.apiRequest(
    APILogEvent.FOOD_DELIVERY_COMPLETE,
    planId,
    { jobOrderId, completed },
    session
  )

  res.status(200).json(updatedJobOrder)
}

export default APIAccessController(
  [], // No permissions required - anyone can mark deliveries as complete
  APIMethodHandler({ post })
)
