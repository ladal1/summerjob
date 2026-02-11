import { NextApiRequest, NextApiResponse } from 'next'
import { createToolName, getToolNames } from 'lib/data/tool-names'
import { APIAccessController } from 'lib/api/APIAccessControler'
import { APIMethodHandler } from 'lib/api/MethodHandler'
import { WrappedError, ApiError } from 'lib/types/api-error'
import { ExtendedSession, Permission } from 'lib/types/auth'
import { ToolNameCreateData, ToolNameCreateSchema } from 'lib/types/tool-name'
import { parseForm } from 'lib/api/parse-form'
import {
  getActiveEventOrSendError,
  validateOrSendError,
} from 'lib/api/validator'
import logger from 'lib/logger/logger'
import { APILogEvent } from 'lib/types/logger'
import { isAccessAllowed } from 'lib/auth/auth'

export type ToolNamesAPIGetResponse = Awaited<ReturnType<typeof getToolNames>>

async function get(
  req: NextApiRequest,
  res: NextApiResponse<ToolNamesAPIGetResponse | WrappedError<ApiError>>
) {
  const toolNames = await getToolNames()
  res.status(200).json(toolNames)
}

export type ToolNamesAPIPostData = ToolNameCreateData
export type ToolNamesAPIPostResponse = Awaited<
  ReturnType<typeof createToolName>
>
async function post(
  req: NextApiRequest,
  res: NextApiResponse<ToolNamesAPIPostResponse | WrappedError<ApiError>>,
  session: ExtendedSession
) {
  if (!isAccessAllowed([Permission.ADMIN], session)) {
    res.status(403).end()
    return
  }
  const summerJobEvent = await getActiveEventOrSendError(res)
  if (!summerJobEvent) {
    return
  }
  const { json } = await parseForm(req)
  const data = validateOrSendError(ToolNameCreateSchema, json, res)
  if (!data) {
    return
  }
  await logger.apiRequest(
    APILogEvent.TOOL_NAME_CREATE,
    'tool-names',
    json,
    session
  )
  const toolName = await createToolName(data)
  res.status(201).json(toolName)
}

export default APIAccessController([], APIMethodHandler({ get, post }))

export const config = {
  api: {
    bodyParser: false,
  },
}
