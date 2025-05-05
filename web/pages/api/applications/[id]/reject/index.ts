import { NextApiRequest, NextApiResponse } from 'next'
import { APIAccessController } from 'lib/api/APIAccessControler'
import { APIMethodHandler } from 'lib/api/MethodHandler'
import { Permission } from 'lib/types/auth'
import prisma from 'lib/prisma/connection'
import { ApplicationStatus } from 'lib/prisma/client'
import { ExtendedSession } from 'lib/types/auth'
import logger from 'lib/logger/logger'
import { APILogEvent } from 'lib/types/logger'

async function patch(
  req: NextApiRequest,
  res: NextApiResponse,
  session: ExtendedSession
) {
  const id = req.query.id as string

  const updated = await prisma.application.update({
    where: { id },
    data: { status: ApplicationStatus.REJECTED },
  })

  await logger.apiRequest(
    APILogEvent.APPLICATION_REJECTED,
    id,
    {
      status: ApplicationStatus.REJECTED,
      applicationId: id,
    },
    session
  )

  res.status(200).json(updated)
}

export default APIAccessController(
  [Permission.APPLICATIONS],
  APIMethodHandler({ patch })
)
