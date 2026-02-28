import { APIAccessController } from 'lib/api/APIAccessControler'
import { APIMethodHandler } from 'lib/api/MethodHandler'
import { ExtendedSession, Permission } from 'lib/types/auth'
import { APILogEvent } from 'lib/types/logger'
import {
  setReceptionPassword,
  unsetReceptionPassword,
} from 'lib/data/summerjob-event'
import logger from 'lib/logger/logger'
import { NextApiRequest, NextApiResponse } from 'next'

async function post(
  req: NextApiRequest,
  res: NextApiResponse,
  session: ExtendedSession
) {
  const eventId = req.query.eventId as string
  const { password } = req.body

  try {
    if (typeof password === 'string' && password.length > 0) {
      await setReceptionPassword(eventId, password)
      await logger.apiRequest(
        APILogEvent.SMJEVENT_RECEPTION_PASSWORD_MODIFY,
        eventId,
        {},
        session
      )
    } else {
      throw new Error('Neplatné heslo.')
    }
    res.status(200).end()
  } catch (err: unknown) {
    console.error(err)

    const message =
      err instanceof Error
        ? err.message
        : 'Chyba při nastavování hesla pro recepci'

    res.status(400).json({ message })
  }
}

async function del(
  req: NextApiRequest,
  res: NextApiResponse,
  session: ExtendedSession
) {
  const eventId = req.query.eventId as string

  await logger.apiRequest(
    APILogEvent.SMJEVENT_RECEPTION_PASSWORD_DELETE,
    eventId,
    {},
    session
  )
  await unsetReceptionPassword(eventId)

  res.status(200).end()
}

export default APIAccessController(
  [Permission.ADMIN],
  APIMethodHandler({ post, del })
)
