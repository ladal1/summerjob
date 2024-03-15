import { APIAccessController } from 'lib/api/APIAccessControler'
import { APIMethodHandler } from 'lib/api/MethodHandler'
import { parseForm } from 'lib/api/parse-form'
import { validateOrSendError } from 'lib/api/validator'
import { updateRide, deleteRide } from 'lib/data/rides'
import logger from 'lib/logger/logger'
import { ExtendedSession, Permission } from 'lib/types/auth'
import { APILogEvent } from 'lib/types/logger'
import { RideUpdateSchema } from 'lib/types/ride'
import { NextApiRequest, NextApiResponse } from 'next'

async function patch(
  req: NextApiRequest,
  res: NextApiResponse,
  session: ExtendedSession
) {
  const id = req.query.rideId as string
  const { json } = await parseForm(req)
  const data = validateOrSendError(RideUpdateSchema, json, res)
  if (!data) {
    return
  }
  await logger.apiRequest(APILogEvent.PLAN_RIDE_MODIFY, id, json, session)
  await updateRide(id, data)
  res.status(204).end()
}

async function del(
  req: NextApiRequest,
  res: NextApiResponse,
  session: ExtendedSession
) {
  const id = req.query.rideId as string
  await logger.apiRequest(APILogEvent.PLAN_RIDE_DELETE, id, {}, session)
  await deleteRide(id)
  res.status(204).end()
}

export default APIAccessController(
  [Permission.PLANS],
  APIMethodHandler({ patch, del })
)

export const config = {
  api: {
    bodyParser: false,
  },
}
