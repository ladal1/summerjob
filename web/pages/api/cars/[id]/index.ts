import { APIAccessController } from 'lib/api/APIAccessControler'
import { APIMethodHandler } from 'lib/api/MethodHandler'
import { parseForm } from 'lib/api/parse-form'
import { validateOrSendError } from 'lib/api/validator'
import { deleteCar, getCarById, updateCar } from 'lib/data/cars'
import logger from 'lib/logger/logger'
import { ExtendedSession, Permission } from 'lib/types/auth'
import { CarUpdateSchema } from 'lib/types/car'
import { APILogEvent } from 'lib/types/logger'
import { NextApiRequest, NextApiResponse } from 'next'

async function get(
  req: NextApiRequest,
  res: NextApiResponse,
  session: ExtendedSession
) {
  const id = req.query.id as string
  const car = await getCarById(id)
  if (!car) {
    res.status(404).end()
    return
  }
  res.status(200).json(car)
}

async function patch(
  req: NextApiRequest,
  res: NextApiResponse,
  session: ExtendedSession
) {
  const id = req.query.id as string
  const { json } = await parseForm(req)
  console.log(json)
  const carData = validateOrSendError(CarUpdateSchema, json, res)
  if (!carData) {
    return
  }
  await logger.apiRequest(APILogEvent.CAR_MODIFY, id, json, session)
  await updateCar(id, carData)
  res.status(204).end()
}

async function del(
  req: NextApiRequest,
  res: NextApiResponse,
  session: ExtendedSession
) {
  const id = req.query.id as string
  await logger.apiRequest(APILogEvent.CAR_DELETE, id, {}, session)
  await deleteCar(id)
  res.status(204).end()
}

export default APIAccessController(
  [Permission.CARS],
  APIMethodHandler({ get, patch, del })
)

export const config = {
  api: {
    bodyParser: false,
  },
}
