import { APIAccessController } from 'lib/api/APIAccessControler'
import { APIMethodHandler } from 'lib/api/MethodHandler'
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
  await logger.apiRequest(APILogEvent.AREA_DELETE, id, req.body, session)
  await deleteArea(id)
  res.status(204).end()
}

export type AreaAPIPatchData = AreaUpdateData
async function patch(
  req: NextApiRequest,
  res: NextApiResponse,
  session: ExtendedSession
) {
  const data = validateOrSendError(AreaUpdateSchema, req.body, res)
  if (!data) {
    return
  }
  const id = req.query.areaId as string
  await logger.apiRequest(APILogEvent.AREA_MODIFY, id, req.body, session)
  await updateArea(id, data)
  res.status(204).end()
}

export default APIAccessController(
  [Permission.ADMIN],
  APIMethodHandler({ patch, del })
)
