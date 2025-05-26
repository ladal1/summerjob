import { APIAccessController } from 'lib/api/APIAccessControler'
import { APIMethodHandler } from 'lib/api/MethodHandler'
import { ExtendedSession, Permission } from 'lib/types/auth'
import { APILogEvent } from 'lib/types/logger'
import { setApplicationPasswordProtection } from 'lib/data/summerjob-event'
import logger from 'lib/logger/logger'
import { NextApiRequest, NextApiResponse } from 'next'

async function post(
  req: NextApiRequest,
  res: NextApiResponse,
  session: ExtendedSession
) {
  const eventId = req.query.eventId as string
  const { enable, password } = req.body

  try {
    const result = await setApplicationPasswordProtection(
      eventId,
      enable,
      password
    )

    await logger.apiRequest(
      APILogEvent.SMJEVENT_PASSWORD_PROTECTION_TOGGLE,
      eventId,
      {
        isPasswordProtected: result,
      },
      session
    )

    res.status(200).json({ isPasswordProtected: result })
  } catch (err: unknown) {
    console.error(err)

    const message =
      err instanceof Error
        ? err.message
        : 'Chyba při nastavování ochrany přihlášky'

    res.status(400).json({ message })
  }
}

export default APIAccessController(
  [Permission.ADMIN],
  APIMethodHandler({ post })
)
