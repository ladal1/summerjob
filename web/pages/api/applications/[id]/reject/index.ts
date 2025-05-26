import { NextApiRequest, NextApiResponse } from 'next'
import { APIAccessController } from 'lib/api/APIAccessControler'
import { APIMethodHandler } from 'lib/api/MethodHandler'
import { Permission } from 'lib/types/auth'
import prisma from 'lib/prisma/connection'
import { ApplicationStatus } from 'lib/prisma/client'

async function patch(req: NextApiRequest, res: NextApiResponse) {
  const id = req.query.id as string

  await prisma.application.update({
    where: { id },
    data: { status: ApplicationStatus.REJECTED },
  })

  res.status(200).json({ status: ApplicationStatus.REJECTED })
}

export default APIAccessController(
  [Permission.APPLICATIONS],
  APIMethodHandler({ patch })
)
