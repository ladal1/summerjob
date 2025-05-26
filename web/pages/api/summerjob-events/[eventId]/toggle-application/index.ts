import { APIAccessController } from 'lib/api/APIAccessControler'
import { APIMethodHandler } from 'lib/api/MethodHandler'
import { ExtendedSession, Permission } from 'lib/types/auth'
import { toggleApplicationOpen } from 'lib/data/summerjob-event'
import { APILogEvent } from 'lib/types/logger'
import logger from 'lib/logger/logger'
import { NextApiRequest, NextApiResponse } from 'next'

async function post(
  req: NextApiRequest,
  res: NextApiResponse,
  session: ExtendedSession
) {
  const id = req.query.eventId as string

  const newValue = await toggleApplicationOpen(id)

  await logger.apiRequest(
    APILogEvent.SMJEVENT_APPLICATION_TOGGLE,
    id,
    {
      isApplicationOpen: newValue,
    },
    session
  )

  res.status(200).json({ isApplicationOpen: newValue })
}

export default APIAccessController(
  [Permission.ADMIN],
  APIMethodHandler({ post })
)
