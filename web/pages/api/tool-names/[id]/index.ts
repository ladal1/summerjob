import { APIAccessController } from 'lib/api/APIAccessControler'
import { APIMethodHandler } from 'lib/api/MethodHandler'
import { parseForm } from 'lib/api/parse-form'
import { validateOrSendError } from 'lib/api/validator'
import { isAccessAllowed } from 'lib/auth/auth'
import {
  deleteToolName,
  getToolNameById,
  updateToolName,
} from 'lib/data/tool-names'
import logger from 'lib/logger/logger'
import { ExtendedSession, Permission } from 'lib/types/auth'
import { ToolNameUpdateSchema } from 'lib/types/tool-name'
import { APILogEvent } from 'lib/types/logger'
import { NextApiRequest, NextApiResponse } from 'next'

async function get(req: NextApiRequest, res: NextApiResponse) {
  const id = req.query.id as string
  const toolName = await getToolNameById(id)
  if (!toolName) {
    res.status(404).end()
    return
  }
  res.status(200).json(toolName)
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
  const toolNameData = validateOrSendError(ToolNameUpdateSchema, json, res)
  if (!toolNameData) {
    return
  }
  await logger.apiRequest(APILogEvent.TOOL_NAME_MODIFY, id, json, session)
  await updateToolName(id, toolNameData)
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
  await logger.apiRequest(APILogEvent.TOOL_NAME_DELETE, id, {}, session)
  await deleteToolName(id)
  res.status(204).end()
}

export default APIAccessController([], APIMethodHandler({ get, patch, del }))

export const config = {
  api: {
    bodyParser: false,
  },
}
