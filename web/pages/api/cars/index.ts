import { APIAccessController } from 'lib/api/APIAccessControler'
import { APIMethodHandler } from 'lib/api/MethodHandler'
import {
  getActiveEventOrSendError,
  validateOrSendError,
} from 'lib/api/validator'
import { ApiError, WrappedError } from 'lib/types/api-error'
import { createCar, getCars } from 'lib/data/cars'
import logger from 'lib/logger/logger'
import { ExtendedSession, Permission } from 'lib/types/auth'
import { CarCreateData, CarCreateSchema } from 'lib/types/car'
import { APILogEvent } from 'lib/types/logger'
import { NextApiRequest, NextApiResponse } from 'next'

export type CarsAPIGetResponse = Awaited<ReturnType<typeof getCars>>
async function get(
  req: NextApiRequest,
  res: NextApiResponse<CarsAPIGetResponse | WrappedError<ApiError>>
) {
  const summerJobEvent = await getActiveEventOrSendError(res)
  if (!summerJobEvent) {
    return
  }
  const cars = await getCars()
  res.status(200).json(cars)
}

export type CarsAPIPostData = CarCreateData
export type CarsAPIPostResponse = Awaited<ReturnType<typeof createCar>>
async function post(
  req: NextApiRequest,
  res: NextApiResponse<CarsAPIPostResponse | WrappedError<ApiError>>,
  session: ExtendedSession
) {
  const summerJobEvent = await getActiveEventOrSendError(res)
  if (!summerJobEvent) {
    return
  }
  const data = validateOrSendError(CarCreateSchema, req.body, res)
  if (!data) {
    return
  }
  await logger.apiRequest(APILogEvent.CAR_CREATE, 'cars', req.body, session)
  const car = await createCar(data, summerJobEvent.id)
  res.status(201).json(car)
}

export default APIAccessController(
  [Permission.CARS, Permission.PLANS],
  APIMethodHandler({ get, post })
)
