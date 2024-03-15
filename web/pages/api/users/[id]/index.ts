import { APIAccessController } from 'lib/api/APIAccessControler'
import { APIMethodHandler } from 'lib/api/MethodHandler'
import { validateOrSendError } from 'lib/api/validator'
import { updateUser } from 'lib/data/users'
import { ExtendedSession, Permission } from 'lib/types/auth'
import { UserUpdateData, UserUpdateSchema } from 'lib/types/user'
import { NextApiRequest, NextApiResponse } from 'next'
import logger from 'lib/logger/logger'
import { APILogEvent } from 'lib/types/logger'
import { parseForm } from 'lib/api/parse-form'

export type UserAPIPatchData = UserUpdateData
async function patch(
  req: NextApiRequest,
  res: NextApiResponse,
  session: ExtendedSession
) {
  const id = req.query.id as string
  const { json } = await parseForm(req)
  const userData = validateOrSendError(UserUpdateSchema, json, res)
  if (!userData) {
    return
  }
  await logger.apiRequest(APILogEvent.USER_MODIFY, id, json, session)
  await updateUser(id, userData)
  res.status(204).end()
}

export default APIAccessController(
  [Permission.ADMIN],
  APIMethodHandler({ patch })
)

export const config = {
  api: {
    bodyParser: false
  }
}