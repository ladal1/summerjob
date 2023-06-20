import { APILogEvent } from 'lib/types/logger'
import { pinoLogger } from './pino'
import { addLogEvent } from 'lib/data/logs'
import { ExtendedSession } from 'lib/types/auth'

async function apiRequest(
  type: APILogEvent,
  resourceId: string,
  data: object,
  session: ExtendedSession
) {
  const payload = JSON.stringify(data)
  await addLogEvent(
    session.userID,
    session.username,
    resourceId,
    type,
    payload === '""' ? '' : payload
  )
  pinoLogger.debug({ type, data })
}

const logger = {
  apiRequest,
  info: pinoLogger.info.bind(pinoLogger),
  debug: pinoLogger.debug.bind(pinoLogger),
  error: pinoLogger.error.bind(pinoLogger),
  warn: pinoLogger.warn.bind(pinoLogger),
  fatal: pinoLogger.fatal.bind(pinoLogger),
}

export default logger
