import { APIAccessController } from 'lib/api/APIAccessControler'
import { NextApiRequest, NextApiResponse } from 'next'
import {
  isWorkerAssignedToNonAdorationAreaOnDate,
  signUpForAdorationSlot,
} from 'lib/data/adoration'
import prisma from 'lib/prisma/connection'
import { ExtendedSession } from 'lib/types/auth'

export default APIAccessController(
  [],
  async function handler(
    req: NextApiRequest,
    res: NextApiResponse,
    session: ExtendedSession
  ) {
    const slotId = req.query.id as string
    if (!slotId || !session.userID) {
      return res
        .status(400)
        .json({ message: 'Chybí slot nebo přihlášený uživatel.' })
    }

    const slot = await prisma.adorationSlot.findUnique({
      where: { id: slotId },
      select: { dateStart: true, capacity: true },
    })
    if (!slot) {
      return res.status(404).json({ message: 'Adorační slot nebyl nalezen.' })
    }

    const hasConflict = await isWorkerAssignedToNonAdorationAreaOnDate(
      session.userID,
      slot.dateStart
    )
    if (hasConflict) {
      return res.status(403).json({
        message:
          'Jste přiřazeni k jobu v oblasti, kde není možné adorovat. Pro přihlášení na adoraci kontaktujte Job tým.',
      })
    }

    const updated = await signUpForAdorationSlot(slotId, session.userID)
    res.status(200).json(updated)
  }
)
