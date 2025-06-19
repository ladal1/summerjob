import { APIAccessController } from 'lib/api/APIAccessControler'
import { Permission } from 'lib/types/auth'
import { NextApiRequest, NextApiResponse } from 'next'
import prisma from 'lib/prisma/connection'
import { ExtendedSession } from 'lib/types/auth'

export default APIAccessController(
  [Permission.ADMIN],
  async function handler(
    req: NextApiRequest,
    res: NextApiResponse,
    session: ExtendedSession
  ) {
    const { slotIds, location } = req.body as {
      slotIds: string[]
      location: string
    }

    if (!slotIds?.length || !location) {
      return res.status(400).json({ message: 'Chybí sloty nebo lokace.' })
    }

    const updated = await prisma.adorationSlot.updateMany({
      where: {
        id: { in: slotIds },
      },
      data: {
        location,
      },
    })

    res.status(200).json(updated)
  }
)
