import { APIAccessController } from 'lib/api/APIAccessControler'
import { APIMethodHandler } from 'lib/api/MethodHandler'
import { parseForm } from 'lib/api/parse-form'
import { validateOrSendError } from 'lib/api/validator'
import {
  deleteWorkAllergy,
  getWorkAllergyById,
  updateWorkAllergy,
} from 'lib/data/work-allergies'
import logger from 'lib/logger/logger'
import { ExtendedSession, Permission } from 'lib/types/auth'
import { WorkAllergyUpdateSchema } from 'lib/types/work-allergy'
import { APILogEvent } from 'lib/types/logger'
import { NextApiRequest, NextApiResponse } from 'next'
import { isAccessAllowed } from 'lib/auth/auth'

async function get(req: NextApiRequest, res: NextApiResponse) {
  const id = req.query.id as string
  const workAllergy = await getWorkAllergyById(id)
  if (!workAllergy) {
    res.status(404).end()
    return
  }
  res.status(200).json(workAllergy)
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
  const workAllergyData = validateOrSendError(
    WorkAllergyUpdateSchema,
    json,
    res
  )
  if (!workAllergyData) {
    return
  }
  await logger.apiRequest(APILogEvent.WORK_ALLERGY_MODIFY, id, json, session)
  await updateWorkAllergy(id, workAllergyData)
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
  await logger.apiRequest(APILogEvent.WORK_ALLERGY_DELETE, id, {}, session)
  await deleteWorkAllergy(id)
  res.status(204).end()
}

export default APIAccessController([], APIMethodHandler({ get, patch, del }))

export const config = {
  api: {
    bodyParser: false,
  },
}
