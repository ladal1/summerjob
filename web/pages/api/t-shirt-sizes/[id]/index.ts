import { APIAccessController } from 'lib/api/APIAccessControler'
import { APIMethodHandler } from 'lib/api/MethodHandler'
import { parseForm } from 'lib/api/parse-form'
import { validateOrSendError } from 'lib/api/validator'
import { isAccessAllowed } from 'lib/auth/auth'
import {
  deleteTShirtSize,
  getTShirtSizeById,
  updateTShirtSize,
} from 'lib/data/t-shirt-sizes'
import logger from 'lib/logger/logger'
import { ExtendedSession, Permission } from 'lib/types/auth'
import { TShirtSizeUpdateSchema } from 'lib/types/t-shirt-size'
import { APILogEvent } from 'lib/types/logger'
import { NextApiRequest, NextApiResponse } from 'next'

async function get(req: NextApiRequest, res: NextApiResponse) {
  const id = req.query.id as string
  const size = await getTShirtSizeById(id)
  if (!size) {
    res.status(404).end()
    return
  }
  res.status(200).json(size)
}

async function patch(
  req: NextApiRequest,
  res: NextApiResponse,
  session: ExtendedSession
) {
  if (!isAccessAllowed([Permission.ADMIN], session)) {
    res.status(403).end()
    return
  }
  const id = req.query.id as string
  const { json } = await parseForm(req)
  const data = validateOrSendError(TShirtSizeUpdateSchema, json, res)
  if (!data) {
    return
  }
  await logger.apiRequest(APILogEvent.TSHIRT_SIZE_MODIFY, id, json, session)
  await updateTShirtSize(id, data)
  res.status(204).end()
}

async function del(
  req: NextApiRequest,
  res: NextApiResponse,
  session: ExtendedSession
) {
  if (!isAccessAllowed([Permission.ADMIN], session)) {
    res.status(403).end()
    return
  }
  const id = req.query.id as string
  await logger.apiRequest(APILogEvent.TSHIRT_SIZE_DELETE, id, {}, session)
  await deleteTShirtSize(id)
  res.status(204).end()
}

export default APIAccessController([], APIMethodHandler({ get, patch, del }))

export const config = {
  api: {
    bodyParser: false,
  },
}
