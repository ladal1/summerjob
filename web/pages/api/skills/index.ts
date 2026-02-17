import { NextApiRequest, NextApiResponse } from 'next'
import { createSkill, getSkills } from 'lib/data/skills'
import { APIAccessController } from 'lib/api/APIAccessControler'
import { APIMethodHandler } from 'lib/api/MethodHandler'
import { WrappedError, ApiError } from 'lib/types/api-error'
import { ExtendedSession, Permission } from 'lib/types/auth'
import { SkillHasCreateData, SkillHasCreateSchema } from 'lib/types/skill'
import { parseForm } from 'lib/api/parse-form'
import {
  getActiveEventOrSendError,
  validateOrSendError,
} from 'lib/api/validator'
import logger from 'lib/logger/logger'
import { APILogEvent } from 'lib/types/logger'
import { isAccessAllowed } from 'lib/auth/auth'

export type SkillHasAPIGetResponse = Awaited<ReturnType<typeof getSkills>>

async function get(
  req: NextApiRequest,
  res: NextApiResponse<SkillHasAPIGetResponse | WrappedError<ApiError>>
) {
  const skills = await getSkills()
  res.status(200).json(skills)
}

export type SkillHasAPIPostData = SkillHasCreateData
export type SkillHasAPIPostResponse = Awaited<ReturnType<typeof createSkill>>
async function post(
  req: NextApiRequest,
  res: NextApiResponse<SkillHasAPIPostResponse | WrappedError<ApiError>>,
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
  const data = validateOrSendError(SkillHasCreateSchema, json, res)
  if (!data) {
    return
  }
  await logger.apiRequest(APILogEvent.SKILL_CREATE, 'skills', json, session)
  const skill = await createSkill(data)
  res.status(201).json(skill)
}

export default APIAccessController([], APIMethodHandler({ get, post }))

export const config = {
  api: {
    bodyParser: false,
  },
}
