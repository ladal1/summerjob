import { NextApiRequest, NextApiResponse } from 'next'
import { getFoodAllergies } from 'lib/data/food-allergies'
import { APIAccessController } from 'lib/api/APIAccessControler'
import { APIMethodHandler } from 'lib/api/MethodHandler'
import { WrappedError, ApiError } from 'lib/types/api-error'
import { Permission } from 'lib/types/auth'

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

export default APIAccessController([], APIMethodHandler({ get }))
