import { APIAccessController } from 'lib/api/APIAccessControler'
import { APIMethodHandler } from 'lib/api/MethodHandler'
import { parseForm } from 'lib/api/parse-form'
import { 
  getFoodDeliveriesByPlanId, 
  createFoodDelivery, 
  replaceAllFoodDeliveries,
  FoodDeliveryCreateData 
} from 'lib/data/food-delivery'
import logger from 'lib/logger/logger'
import { ExtendedSession, Permission } from 'lib/types/auth'
import { APILogEvent } from 'lib/types/logger'
import { NextApiRequest, NextApiResponse } from 'next'

export type FoodDeliveryAPIGetResponse = Awaited<ReturnType<typeof getFoodDeliveriesByPlanId>>
export type FoodDeliveryAPIPostData = FoodDeliveryCreateData
export type FoodDeliveryAPIBulkPostData = FoodDeliveryCreateData[]

async function get(
  req: NextApiRequest,
  res: NextApiResponse<FoodDeliveryAPIGetResponse>
) {
  const planId = req.query.planId as string
  const deliveries = await getFoodDeliveriesByPlanId(planId)
  res.status(200).json(deliveries)
}

async function post(
  req: NextApiRequest,
  res: NextApiResponse,
  session: ExtendedSession
) {
  const planId = req.query.planId as string
  
  // Handle both JSON and form data
  let json: unknown
  const contentType = req.headers['content-type'] || ''
  
  if (contentType.includes('application/json')) {
    // Parse JSON body manually since we have bodyParser: false
    const chunks: Uint8Array[] = []
    for await (const chunk of req) {
      chunks.push(chunk)
    }
    const body = Buffer.concat(chunks).toString()
    json = JSON.parse(body)
  } else {
    // Use parseForm for multipart/form-data
    const result = await parseForm(req)
    json = result.json
  }
  
  // Check if this is a bulk replace operation
  if (Array.isArray(json)) {
    const deliveries: FoodDeliveryCreateData[] = json.map(data => ({ ...data, planId }))
    
    await logger.apiRequest(APILogEvent.FOOD_DELIVERY_CREATE, planId, { bulk: true, count: deliveries.length }, session)
    const createdDeliveries = await replaceAllFoodDeliveries(planId, deliveries)
    
    res.status(200).json(createdDeliveries)
  } else {
    // Single delivery creation (existing logic)
    if (!json || typeof json !== 'object') {
      res.status(400).json({ error: 'Invalid request body' })
      return
    }
    
    const jsonObj = json as Record<string, unknown>
    if (typeof jsonObj.courierNum !== 'number') {
      res.status(400).json({ error: 'courierNum is required and must be a number' })
      return
    }
    
    const data: FoodDeliveryCreateData = {
      courierNum: jsonObj.courierNum,
      planId,
      jobs: Array.isArray(jsonObj.jobs) ? jsonObj.jobs : []
    }
    
    await logger.apiRequest(APILogEvent.FOOD_DELIVERY_CREATE, planId, data, session)
    const delivery = await createFoodDelivery(data)
    
    res.status(201).json(delivery)
  }
}

export default APIAccessController(
  [Permission.PLANS],
  APIMethodHandler({ get, post })
)

export const config = {
  api: {
    bodyParser: false
  }
}
