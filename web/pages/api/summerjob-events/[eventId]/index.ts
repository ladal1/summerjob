import { APIAccessController } from 'lib/api/APIAccessControler'
import { APIMethodHandler } from 'lib/api/MethodHandler'
import { validateOrSendError } from 'lib/api/validator'
import { ApiBadRequestError } from 'lib/types/api-error'
import {
  deleteSummerJobEvent,
  updateSummerJobEvent,
} from 'lib/data/summerjob-event'
import logger from 'lib/logger/logger'
import { ExtendedSession, Permission } from 'lib/types/auth'
import { APILogEvent } from 'lib/types/logger'
import {
  SummerJobEventUpdateDataInput,
  SummerJobEventUpdateSchema,
} from 'lib/types/summerjob-event'
import { NextApiRequest, NextApiResponse } from 'next'

export type SummerJobEventsAPIPatchData = SummerJobEventUpdateDataInput
async function patch(
  req: NextApiRequest,
  res: NextApiResponse,
  session: ExtendedSession
) {
  const id = req.query.eventId as string
  const data = validateOrSendError(SummerJobEventUpdateSchema, req.body, res)
  if (!data) {
    return
  }
  await logger.apiRequest(APILogEvent.SMJEVENT_MODIFY, id, req.body, session)
  if (!data.isActive) {
    res.status(400).json({
      error: new ApiBadRequestError(
        'Do not set events to inactive. Set another event to active instead.'
      ),
    })
    return
  }
  await updateSummerJobEvent(id, data)
  res.status(204).end()
}

async function del(
  req: NextApiRequest,
  res: NextApiResponse,
  session: ExtendedSession
) {
  const id = req.query.eventId as string
  await logger.apiRequest(APILogEvent.SMJEVENT_DELETE, id, req.body, session)
  await deleteSummerJobEvent(id)
  res.status(204).end()
}

export default APIAccessController(
  [Permission.ADMIN],
  APIMethodHandler({ patch, del })
)
