import { NextApiRequest, NextApiResponse } from 'next'
import { createFoodAllergy, getFoodAllergies } from 'lib/data/food-allergies'
import { APIAccessController } from 'lib/api/APIAccessControler'
import { APIMethodHandler } from 'lib/api/MethodHandler'
import { WrappedError, ApiError } from 'lib/types/api-error'
import { ExtendedSession, Permission } from 'lib/types/auth'
import {
  FoodAllergyCreateData,
  FoodAllergyCreateSchema,
} from 'lib/types/food-allergy'
import { parseForm } from 'lib/api/parse-form'
import {
  getActiveEventOrSendError,
  validateOrSendError,
} from 'lib/api/validator'
import logger from 'lib/logger/logger'
import { APILogEvent } from 'lib/types/logger'
import { isAccessAllowed } from 'lib/auth/auth'

export type FoodAllergiesAPIGetResponse = Awaited<
  ReturnType<typeof getFoodAllergies>
>

async function get(
  req: NextApiRequest,
  res: NextApiResponse<FoodAllergiesAPIGetResponse | WrappedError<ApiError>>
) {
  const foodAllergies = await getFoodAllergies()
  res.status(200).json(foodAllergies)
}

export type FoodAllergiesAPIPostData = FoodAllergyCreateData
export type FoodAllergiesAPIPostResponse = Awaited<
  ReturnType<typeof createFoodAllergy>
>
async function post(
  req: NextApiRequest,
  res: NextApiResponse<FoodAllergiesAPIPostResponse | WrappedError<ApiError>>,
  session: ExtendedSession
) {
  if (!isAccessAllowed([Permission.ADMIN], session)) {
    res.status(403).end()
    return
  }
  const summerJobEvent = await getActiveEventOrSendError(res)
  if (!summerJobEvent) {
    return
  }
  const { json } = await parseForm(req)
  const data = validateOrSendError(FoodAllergyCreateSchema, json, res)
  if (!data) {
    return
  }
  await logger.apiRequest(
    APILogEvent.FOOD_ALLERGY_CREATE,
    'food-allergies',
    json,
    session
  )
  const foodAllergy = await createFoodAllergy(data)
  res.status(201).json(foodAllergy)
}

export default APIAccessController([], APIMethodHandler({ get, post }))

export const config = {
  api: {
    bodyParser: false,
  },
}
