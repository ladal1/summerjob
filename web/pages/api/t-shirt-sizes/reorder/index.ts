import { APIAccessController } from 'lib/api/APIAccessControler'
import { APIMethodHandler } from 'lib/api/MethodHandler'
import { parseForm } from 'lib/api/parse-form'
import { validateOrSendError } from 'lib/api/validator'
import { isAccessAllowed } from 'lib/auth/auth'
import { reorderTShirtSizes } from 'lib/data/t-shirt-sizes'
import logger from 'lib/logger/logger'
import { ExtendedSession, Permission } from 'lib/types/auth'
import { APILogEvent } from 'lib/types/logger'
import { TShirtSizeReorderSchema } from 'lib/types/t-shirt-size'
import { NextApiRequest, NextApiResponse } from 'next'

async function post(
  req: NextApiRequest,
  res: NextApiResponse,
  session: ExtendedSession
) {
  if (!isAccessAllowed([Permission.ADMIN], session)) {
    res.status(403).end()
    return
  }
  const { json } = await parseForm(req)
  const data = validateOrSendError(TShirtSizeReorderSchema, json, res)
  if (!data) {
    return
  }
  await logger.apiRequest(
    APILogEvent.TSHIRT_SIZE_MODIFY,
    't-shirt-sizes-reorder',
    json,
    session
  )
  await reorderTShirtSizes(data.ids)
  res.status(204).end()
}

export default APIAccessController([], APIMethodHandler({ post }))

export const config = {
  api: {
    bodyParser: false,
  },
}
