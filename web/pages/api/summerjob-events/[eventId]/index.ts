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
import { parseForm } from 'lib/api/parse-form'

export type SummerJobEventsAPIPatchData = SummerJobEventUpdateDataInput
async function patch(
  req: NextApiRequest,
  res: NextApiResponse,
  session: ExtendedSession
) {
  const id = req.query.eventId as string
  const { json } = await parseForm(req)
  const data = validateOrSendError(SummerJobEventUpdateSchema, json, res)
  if (!data) {
    return
  }
  await logger.apiRequest(APILogEvent.SMJEVENT_MODIFY, id, json, session)
  if (!data.isActive) {
    res.status(400).json({
      error: new ApiBadRequestError(
        'Do not set events to inactive. Set another event to active instead.'
      ),
    })
    return
  }
  const test = await updateSummerJobEvent(id, data)
  res.status(204).end()
}

async function del(
  req: NextApiRequest,
  res: NextApiResponse,
  session: ExtendedSession
) {
  const id = req.query.eventId as string
  await logger.apiRequest(APILogEvent.SMJEVENT_DELETE, id, {}, session)
  await deleteSummerJobEvent(id)
  res.status(204).end()
}

export default APIAccessController(
  [Permission.ADMIN],
  APIMethodHandler({ patch, del })
)

export const config = {
  api: {
    bodyParser: false,
  },
}
