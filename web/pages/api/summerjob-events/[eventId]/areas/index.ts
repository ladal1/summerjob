import { APIAccessController } from 'lib/api/APIAccessControler'
import { APIMethodHandler } from 'lib/api/MethodHandler'
import { validateOrSendError } from 'lib/api/validator'
import { WrappedError } from 'lib/types/api-error'
import { createArea, getAreas } from 'lib/data/areas'
import logger from 'lib/logger/logger'
import { AreaCreateData, AreaCreateSchema } from 'lib/types/area'
import { ExtendedSession, Permission } from 'lib/types/auth'
import { APILogEvent } from 'lib/types/logger'
import { NextApiRequest, NextApiResponse } from 'next'
import { ApiError } from 'next/dist/server/api-utils'
import { parseForm } from 'lib/api/parse-form'

export type AreasAPIGetResponse = Awaited<ReturnType<typeof getAreas>>
async function get(
  req: NextApiRequest,
  res: NextApiResponse<AreasAPIGetResponse>
) {
  const areas = await getAreas()
  res.status(200).json(areas)
}

export type AreasAPIPostData = Omit<AreaCreateData, 'summerJobEventId'>
export type AreasAPIPostResponse = Awaited<ReturnType<typeof createArea>>
async function post(
  req: NextApiRequest,
  res: NextApiResponse<AreasAPIPostResponse | WrappedError<ApiError>>,
  session: ExtendedSession
) {
  const summerJobEventId = req.query.eventId as string
  const { json } = await parseForm(req)
  const result = validateOrSendError(
    AreaCreateSchema,
    { ...json, summerJobEventId },
    res
  )
  console.log(result)
  if (!result) {
    return
  }
  await logger.apiRequest(
    APILogEvent.AREA_CREATE,
    `summerjob-events/${summerJobEventId}/areas`,
    json,
    session
  )
  const area = await createArea(result)
  res.status(201).json(area)
}

export default APIAccessController(
  [Permission.ADMIN],
  APIMethodHandler({ get, post })
)

export const config = {
  api: {
    bodyParser: false
  }
}