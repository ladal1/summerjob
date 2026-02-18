import { NextApiRequest, NextApiResponse } from 'next'
import { createWorkAllergy, getWorkAllergies } from 'lib/data/work-allergies'
import { APIAccessController } from 'lib/api/APIAccessControler'
import { APIMethodHandler } from 'lib/api/MethodHandler'
import { WrappedError, ApiError } from 'lib/types/api-error'
import { ExtendedSession, Permission } from 'lib/types/auth'
import {
  WorkAllergyCreateData,
  WorkAllergyCreateSchema,
} from 'lib/types/work-allergy'
import { parseForm } from 'lib/api/parse-form'
import {
  getActiveEventOrSendError,
  validateOrSendError,
} from 'lib/api/validator'
import logger from 'lib/logger/logger'
import { APILogEvent } from 'lib/types/logger'
import { isAccessAllowed } from 'lib/auth/auth'

export type WorkAllergiesAPIGetResponse = Awaited<
  ReturnType<typeof getWorkAllergies>
>

async function get(
  req: NextApiRequest,
  res: NextApiResponse<WorkAllergiesAPIGetResponse | WrappedError<ApiError>>
) {
  const workAllergies = await getWorkAllergies()
  res.status(200).json(workAllergies)
}

export type WorkAllergiesAPIPostData = WorkAllergyCreateData
export type WorkAllergiesAPIPostResponse = Awaited<
  ReturnType<typeof createWorkAllergy>
>
async function post(
  req: NextApiRequest,
  res: NextApiResponse<WorkAllergiesAPIPostResponse | WrappedError<ApiError>>,
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
  const data = validateOrSendError(WorkAllergyCreateSchema, json, res)
  if (!data) {
    return
  }
  await logger.apiRequest(
    APILogEvent.WORK_ALLERGY_CREATE,
    'work-allergies',
    json,
    session
  )
  const workAllergy = await createWorkAllergy(data)
  res.status(201).json(workAllergy)
}

export default APIAccessController([], APIMethodHandler({ get, post }))

export const config = {
  api: {
    bodyParser: false,
  },
}
