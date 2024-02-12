import { APIAccessController } from 'lib/api/APIAccessControler'
import { APIMethodHandler } from 'lib/api/MethodHandler'
import { parseForm } from 'lib/api/parse-form'
import { validateOrSendError } from 'lib/api/validator'
import {
  createSummerJobEvent,
  getSummerJobEvents,
} from 'lib/data/summerjob-event'
import logger from 'lib/logger/logger'
import { ExtendedSession, Permission } from 'lib/types/auth'
import { APILogEvent } from 'lib/types/logger'
import {
  SummerJobEventCreateDataInput,
  SummerJobEventCreateSchema,
} from 'lib/types/summerjob-event'
import { NextApiRequest, NextApiResponse } from 'next'

export type SummerJobEventsAPIPostData = SummerJobEventCreateDataInput
export type SummerJobEventsAPIPostResponse = Awaited<
  ReturnType<typeof createSummerJobEvent>
>
async function post(
  req: NextApiRequest,
  res: NextApiResponse,
  session: ExtendedSession
) {
  const { json } = await parseForm(req)
  const data = validateOrSendError(SummerJobEventCreateSchema, json, res)
  if (!data) {
    return
  }
  await logger.apiRequest(
    APILogEvent.SMJEVENT_CREATE,
    'summerjob-events',
    json,
    session
  )
  const event = await createSummerJobEvent(data)
  res.status(201).json(event)
}

type SummerJobEventsAPIGetResponse = Awaited<
  ReturnType<typeof getSummerJobEvents>
>
async function get(
  req: NextApiRequest,
  res: NextApiResponse<SummerJobEventsAPIGetResponse>
) {
  const events = await getSummerJobEvents()
  res.status(200).json(events)
}

export default APIAccessController(
  [Permission.ADMIN],
  APIMethodHandler({ get, post })
)

export const config = {
  api: {
    bodyParser: false
  }
}