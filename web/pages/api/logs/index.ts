import { APIAccessController } from 'lib/api/APIAccessControler'
import { APIMethodHandler } from 'lib/api/MethodHandler'
import { getLogs } from 'lib/data/logs'
import { Permission } from 'lib/types/auth'
import { APILogEvent } from 'lib/types/logger'
import { NextApiRequest, NextApiResponse } from 'next'

const MAX_RESULTS = 100

export type LogsAPIGetResponse = Awaited<ReturnType<typeof getLogs>>
async function get(
  req: NextApiRequest,
  res: NextApiResponse<LogsAPIGetResponse>
) {
  const { search, eventType, offset, limit } = req.query
  const isEventTypeValid =
    eventType && typeof eventType === 'string' && eventType !== 'all'
  const offsetVal = parseInt(offset as string)
  const isOffsetValid = !isNaN(offsetVal) && offsetVal >= 0
  const limitVal = parseInt(limit as string)
  const isLimitValid =
    !isNaN(limitVal) && limitVal >= 0 && limitVal <= MAX_RESULTS
  const logs = await getLogs({
    text: search as string,
    ...(isEventTypeValid && { type: eventType as APILogEvent }),
    ...(isOffsetValid && { offset: offsetVal }),
    ...(isLimitValid && { limit: limitVal }),
  })
  res.status(200).json(logs)
}

export default APIAccessController(
  [Permission.ADMIN],
  APIMethodHandler({ get })
)
