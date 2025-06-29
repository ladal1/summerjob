import { APIAccessController } from 'lib/api/APIAccessControler'
import { Permission } from 'lib/types/auth'
import { NextApiRequest, NextApiResponse } from 'next'
import prisma from 'lib/prisma/connection'

export default APIAccessController(
  [Permission.ADMIN, Permission.ADORATION],
  async function handler(
    req: NextApiRequest,
    res: NextApiResponse,
  ) {
    const slotId = req.query.id as string

    if (!slotId) {
      return res.status(400).json({ message: 'Chybí slot ID.' })
    }

    await prisma.adorationSlot.delete({ where: { id: slotId } })

    res.status(200).json({ message: 'Slot smazán.' })
  }
)
