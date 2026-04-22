import { NextApiRequest, NextApiResponse } from 'next'
import { createTShirtColor, getTShirtColors } from 'lib/data/t-shirt-colors'
import { APIAccessController } from 'lib/api/APIAccessControler'
import { APIMethodHandler } from 'lib/api/MethodHandler'
import { WrappedError, ApiError } from 'lib/types/api-error'
import { ExtendedSession, Permission } from 'lib/types/auth'
import {
  TShirtColorCreateData,
  TShirtColorCreateSchema,
} from 'lib/types/t-shirt-color'
import { parseForm } from 'lib/api/parse-form'
import { validateOrSendError } from 'lib/api/validator'
import logger from 'lib/logger/logger'
import { APILogEvent } from 'lib/types/logger'
import { isAccessAllowed } from 'lib/auth/auth'

export type TShirtColorsAPIGetResponse = Awaited<
  ReturnType<typeof getTShirtColors>
>

async function get(
  req: NextApiRequest,
  res: NextApiResponse<TShirtColorsAPIGetResponse | WrappedError<ApiError>>
) {
  const colors = await getTShirtColors()
  res.status(200).json(colors)
}

export type TShirtColorsAPIPostData = TShirtColorCreateData
export type TShirtColorsAPIPostResponse = Awaited<
  ReturnType<typeof createTShirtColor>
>
async function post(
  req: NextApiRequest,
  res: NextApiResponse<TShirtColorsAPIPostResponse | WrappedError<ApiError>>,
  session: ExtendedSession
) {
  if (!isAccessAllowed([Permission.ADMIN], session)) {
    res.status(403).end()
    return
  }
  const { json } = await parseForm(req)
  const data = validateOrSendError(TShirtColorCreateSchema, json, res)
  if (!data) {
    return
  }
  await logger.apiRequest(
    APILogEvent.TSHIRT_COLOR_CREATE,
    't-shirt-colors',
    json,
    session
  )
  const color = await createTShirtColor(data)
  res.status(201).json(color)
}

export default APIAccessController([], APIMethodHandler({ get, post }))

export const config = {
  api: {
    bodyParser: false,
  },
}
