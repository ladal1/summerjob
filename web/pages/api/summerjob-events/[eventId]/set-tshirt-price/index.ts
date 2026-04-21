import { APIAccessController } from 'lib/api/APIAccessControler'
import { APIMethodHandler } from 'lib/api/MethodHandler'
import { parseForm } from 'lib/api/parse-form'
import { validateOrSendError } from 'lib/api/validator'
import { setTShirtPrice } from 'lib/data/summerjob-event'
import logger from 'lib/logger/logger'
import { ExtendedSession, Permission } from 'lib/types/auth'
import { APILogEvent } from 'lib/types/logger'
import { TShirtPriceUpdateSchema } from 'lib/types/summerjob-event'
import { NextApiRequest, NextApiResponse } from 'next'

async function post(
  req: NextApiRequest,
  res: NextApiResponse,
  session: ExtendedSession
) {
  const id = req.query.eventId as string
  const { json } = await parseForm(req)
  const data = validateOrSendError(TShirtPriceUpdateSchema, json, res)
  if (!data) {
    return
  }

  const newPrice = await setTShirtPrice(id, data.tShirtPrice)

  await logger.apiRequest(
    APILogEvent.SMJEVENT_MODIFY,
    id,
    { tShirtPrice: newPrice },
    session
  )

  res.status(200).json({ tShirtPrice: newPrice })
}

export default APIAccessController(
  [Permission.ADMIN],
  APIMethodHandler({ post })
)

export const config = {
  api: {
    bodyParser: false,
  },
}
