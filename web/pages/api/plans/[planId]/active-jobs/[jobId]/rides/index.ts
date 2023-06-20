import { APIAccessController } from 'lib/api/APIAccessControler'
import { APIMethodHandler } from 'lib/api/MethodHandler'
import { validateOrSendError } from 'lib/api/validator'
import { WrappedError, ApiBadRequestError, ApiError } from 'lib/types/api-error'
import { createRide } from 'lib/data/rides'
import logger from 'lib/logger/logger'
import { ExtendedSession, Permission } from 'lib/types/auth'
import { APILogEvent } from 'lib/types/logger'
import { RideCreateData, RideCreateSchema } from 'lib/types/ride'
import { NextApiRequest, NextApiResponse } from 'next'

export type RidesAPIPostData = RideCreateData
export type RidesAPIPostResponse = Awaited<ReturnType<typeof createRide>>
async function post(
  req: NextApiRequest,
  res: NextApiResponse<RidesAPIPostResponse | WrappedError<ApiError>>,
  session: ExtendedSession
) {
  const result = validateOrSendError(RideCreateSchema, req.body, res)
  if (!result) {
    return
  }
  await logger.apiRequest(
    APILogEvent.PLAN_RIDE_ADD,
    `plans/${req.query.planId}/active-jobs/${req.query.jobId}/rides`,
    req.body,
    session
  )
  const ride = await createRide(result, req.query.jobId as string)
  res.status(201).json(ride)
}

export default APIAccessController(
  [Permission.PLANS],
  APIMethodHandler({ post })
)
