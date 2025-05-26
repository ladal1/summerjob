import { APIAccessController } from 'lib/api/APIAccessControler'
import { APIMethodHandler } from 'lib/api/MethodHandler'
import { parseFormWithImages } from 'lib/api/parse-form'
import { validateOrSendError } from 'lib/api/validator'
import { ExtendedSession, Permission } from 'lib/types/auth'
import {
  getApplicationById,
  updateApplication,
  deleteApplication,
} from 'lib/data/applications'
import logger from 'lib/logger/logger'
import { ApplicationUpdateSchema } from 'lib/types/application'
import { NextApiRequest, NextApiResponse } from 'next'
import { APILogEvent } from 'lib/types/logger'

export type ApplicationAPIGetResponse = Awaited<
  ReturnType<typeof getApplicationById>
>

async function get(
  req: NextApiRequest,
  res: NextApiResponse<ApplicationAPIGetResponse>
) {
  const id = req.query.id as string
  const application = await getApplicationById(id)

  if (!application) {
    res.status(404).end()
    return
  }

  res.status(200).json(application)
}

async function patch(
  req: NextApiRequest,
  res: NextApiResponse,
  session: ExtendedSession
) {
  const id = req.query.id as string
  const existingApplication = await getApplicationById(id)
  if (!existingApplication) {
    res.status(404).end()
    return
  }

  const { json } = await parseFormWithImages(
    req,
    res,
    id,
    'uploads/applications',
    1
  )
  const applicationData = validateOrSendError(
    ApplicationUpdateSchema,
    json,
    res
  )
  if (!applicationData) return

  await updateApplication(id, applicationData)

  await logger.apiRequest(
    APILogEvent.APPLICATION_MODIFY,
    id,
    applicationData,
    session
  )
  res.status(204).end()
}

async function del(
  req: NextApiRequest,
  res: NextApiResponse,
  session: ExtendedSession
) {
  const id = req.query.id as string
  const existingApplication = await getApplicationById(id)
  if (!existingApplication) {
    res.status(404).end()
    return
  }

  await logger.apiRequest(APILogEvent.APPLICATION_DELETE, id, {}, session)
  await deleteApplication(id)

  res.status(204).end()
}

export default APIAccessController(
  [Permission.APPLICATIONS],
  APIMethodHandler({ get, patch, del })
)

export const config = {
  api: {
    bodyParser: false,
  },
}
