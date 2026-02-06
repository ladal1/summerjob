import { APIAccessController } from 'lib/api/APIAccessControler'
import { APIMethodHandler } from 'lib/api/MethodHandler'
import { parseForm } from 'lib/api/parse-form'
import { validateOrSendError } from 'lib/api/validator'
import {
  deleteFoodAllergy,
  getFoodAllergyById,
  updateFoodAllergy,
} from 'lib/data/food-allergies'
import logger from 'lib/logger/logger'
import { ExtendedSession, Permission } from 'lib/types/auth'
import { FoodAllergyUpdateSchema } from 'lib/types/food-allergy'
import { APILogEvent } from 'lib/types/logger'
import { NextApiRequest, NextApiResponse } from 'next'

async function get(req: NextApiRequest, res: NextApiResponse) {
  const id = req.query.id as string
  const foodAllergy = await getFoodAllergyById(id)
  if (!foodAllergy) {
    res.status(404).end()
    return
  }
  res.status(200).json(foodAllergy)
}

async function patch(
  req: NextApiRequest,
  res: NextApiResponse,
  session: ExtendedSession
) {
  const id = req.query.id as string
  const { json } = await parseForm(req)
  const foodAllergyData = validateOrSendError(
    FoodAllergyUpdateSchema,
    json,
    res
  )
  if (!foodAllergyData) {
    return
  }
  await logger.apiRequest(APILogEvent.FOOD_ALLERGY_MODIFY, id, json, session)
  await updateFoodAllergy(id, foodAllergyData)
  res.status(204).end()
}

async function del(
  req: NextApiRequest,
  res: NextApiResponse,
  session: ExtendedSession
) {
  const id = req.query.id as string
  await logger.apiRequest(APILogEvent.FOOD_ALLERGY_DELETE, id, {}, session)
  await deleteFoodAllergy(id)
  res.status(204).end()
}

export default APIAccessController(
  [Permission.ADMIN],
  APIMethodHandler({ get, patch, del })
)

export const config = {
  api: {
    bodyParser: false,
  },
}
