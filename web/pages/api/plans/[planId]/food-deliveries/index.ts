import { APIAccessController } from 'lib/api/APIAccessControler'
import { APIMethodHandler } from 'lib/api/MethodHandler'
import { parseForm } from 'lib/api/parse-form'
import {
  FoodDeliveryCreateData,
  getFoodDeliveriesByPlanId,
  replaceAllFoodDeliveries,
} from 'lib/data/food-delivery'
import logger from 'lib/logger/logger'
import { ExtendedSession, Permission } from 'lib/types/auth'
import { APILogEvent } from 'lib/types/logger'
import { NextApiRequest, NextApiResponse } from 'next'

export type FoodDeliveryAPIGetResponse = Awaited<
  ReturnType<typeof getFoodDeliveriesByPlanId>
>
export type FoodDeliveryAPIPostData = FoodDeliveryCreateData[]

async function get(
  req: NextApiRequest,
  res: NextApiResponse<FoodDeliveryAPIGetResponse>
) {
  const planId = req.query.planId as string
  res.status(200).json(await getFoodDeliveriesByPlanId(planId))
}

async function post(
  req: NextApiRequest,
  res: NextApiResponse,
  session: ExtendedSession
) {
  const planId = req.query.planId as string
  const { json } = await parseForm(req)

  if (!Array.isArray(json)) {
    res
      .status(400)
      .json({ error: 'Request body must be an array of deliveries' })
    return
  }

  const deliveries: FoodDeliveryCreateData[] = json.map(
    (d: FoodDeliveryCreateData) => ({ ...d, planId })
  )

  await logger.apiRequest(
    APILogEvent.FOOD_DELIVERY_CREATE,
    planId,
    { bulk: true, count: deliveries.length },
    session
  )

  const created = await replaceAllFoodDeliveries(planId, deliveries)
  res.status(200).json(created)
}

export default APIAccessController(
  [Permission.PLANS],
  APIMethodHandler({ get, post })
)

export const config = {
  api: {
    bodyParser: false,
  },
}
