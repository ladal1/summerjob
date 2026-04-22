import { NextApiRequest, NextApiResponse } from 'next'
import { createTShirtSize, getTShirtSizes } from 'lib/data/t-shirt-sizes'
import { APIAccessController } from 'lib/api/APIAccessControler'
import { APIMethodHandler } from 'lib/api/MethodHandler'
import { WrappedError, ApiError } from 'lib/types/api-error'
import { ExtendedSession, Permission } from 'lib/types/auth'
import {
  TShirtSizeCreateData,
  TShirtSizeCreateSchema,
} from 'lib/types/t-shirt-size'
import { parseForm } from 'lib/api/parse-form'
import { validateOrSendError } from 'lib/api/validator'
import logger from 'lib/logger/logger'
import { APILogEvent } from 'lib/types/logger'
import { isAccessAllowed } from 'lib/auth/auth'

export type TShirtSizesAPIGetResponse = Awaited<
  ReturnType<typeof getTShirtSizes>
>

async function get(
  req: NextApiRequest,
  res: NextApiResponse<TShirtSizesAPIGetResponse | WrappedError<ApiError>>
) {
  const sizes = await getTShirtSizes()
  res.status(200).json(sizes)
}

export type TShirtSizesAPIPostData = TShirtSizeCreateData
export type TShirtSizesAPIPostResponse = Awaited<
  ReturnType<typeof createTShirtSize>
>
async function post(
  req: NextApiRequest,
  res: NextApiResponse<TShirtSizesAPIPostResponse | WrappedError<ApiError>>,
  session: ExtendedSession
) {
  if (!isAccessAllowed([Permission.ADMIN], session)) {
    res.status(403).end()
    return
  }
  const { json } = await parseForm(req)
  const data = validateOrSendError(TShirtSizeCreateSchema, json, res)
  if (!data) {
    return
  }
  await logger.apiRequest(
    APILogEvent.TSHIRT_SIZE_CREATE,
    't-shirt-sizes',
    json,
    session
  )
  const size = await createTShirtSize(data)
  res.status(201).json(size)
}

export default APIAccessController([], APIMethodHandler({ get, post }))

export const config = {
  api: {
    bodyParser: false,
  },
}
