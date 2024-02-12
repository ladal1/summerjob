import { APIAccessController } from 'lib/api/APIAccessControler'
import { APIMethodHandler } from 'lib/api/MethodHandler'
import { parseForm } from 'lib/api/parse-form'
import { validateOrSendError } from 'lib/api/validator'
import { deleteArea, updateArea } from 'lib/data/areas'
import logger from 'lib/logger/logger'
import { AreaUpdateData, AreaUpdateSchema } from 'lib/types/area'
import { ExtendedSession, Permission } from 'lib/types/auth'
import { APILogEvent } from 'lib/types/logger'
import { NextApiRequest, NextApiResponse } from 'next'

async function del(
  req: NextApiRequest,
  res: NextApiResponse,
  session: ExtendedSession
) {
  const id = req.query.areaId as string
  await logger.apiRequest(APILogEvent.AREA_DELETE, id, {}, session)
  await deleteArea(id)
  res.status(204).end()
}

export type AreaAPIPatchData = AreaUpdateData
async function patch(
  req: NextApiRequest,
  res: NextApiResponse,
  session: ExtendedSession
) {
  const { json } = await parseForm(req)
  const data = validateOrSendError(AreaUpdateSchema, json, res)
  if (!data) {
    return
  }
  const id = req.query.areaId as string
  await logger.apiRequest(APILogEvent.AREA_MODIFY, id, json, session)
  await updateArea(id, data)
  res.status(204).end()
}

export default APIAccessController(
  [Permission.ADMIN],
  APIMethodHandler({ patch, del })
)

export const config = {
  api: {
    bodyParser: false
  }
}