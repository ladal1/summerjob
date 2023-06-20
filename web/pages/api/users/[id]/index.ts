import { APIAccessController } from 'lib/api/APIAccessControler'
import { APIMethodHandler } from 'lib/api/MethodHandler'
import { validateOrSendError } from 'lib/api/validator'
import { updateUser } from 'lib/data/users'
import { ExtendedSession, Permission } from 'lib/types/auth'
import { UserUpdateData, UserUpdateSchema } from 'lib/types/user'
import { NextApiRequest, NextApiResponse } from 'next'
import logger from 'lib/logger/logger'
import { APILogEvent } from 'lib/types/logger'

export type UserAPIPatchData = UserUpdateData
async function patch(
  req: NextApiRequest,
  res: NextApiResponse,
  session: ExtendedSession
) {
  const id = req.query.id as string
  const userData = validateOrSendError(UserUpdateSchema, req.body, res)
  if (!userData) {
    return
  }
  await logger.apiRequest(APILogEvent.USER_MODIFY, id, req.body, session)
  await updateUser(id, userData)
  res.status(204).end()
}

export default APIAccessController(
  [Permission.ADMIN],
  APIMethodHandler({ patch })
)
