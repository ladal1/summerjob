import { APIAccessController } from 'lib/api/APIAccessControler'
import { Permission, ExtendedSession } from 'lib/types/auth'
import { NextApiRequest, NextApiResponse } from 'next'
import { addHours, isAfter } from 'date-fns'
import { logoutFromAdorationSlot } from 'lib/data/adoration'
import prisma from 'lib/prisma/connection'

export default APIAccessController(
  [Permission.ADMIN, Permission.ADORATION, Permission.RECEPTION],
  async function handler(
    req: NextApiRequest,
    res: NextApiResponse,
    session: ExtendedSession
  ) {
    if (req.method !== 'PATCH') {
      return res.status(405).json({ message: 'Method not allowed' })
    }

    const slotId = req.query.id as string
    const { workerId } = req.body

    if (!slotId || !workerId) {
      return res.status(400).json({ message: 'Chybí slot ID nebo worker ID.' })
    }

    // Enforce 4-hour rule for reception (not for ADMIN/ADORATION)
    const isReceptionOnly =
      session.permissions.includes(Permission.RECEPTION) &&
      !session.permissions.includes(Permission.ADMIN) &&
      !session.permissions.includes(Permission.ADORATION)
    if (isReceptionOnly) {
      const slot = await prisma.adorationSlot.findUnique({
        where: { id: slotId },
        select: { dateStart: true },
      })
      if (!slot) {
        return res.status(404).json({ message: 'Slot nenalezen.' })
      }

      const fourHoursFromNow = addHours(new Date(), 4)
      if (!isAfter(slot.dateStart, fourHoursFromNow)) {
        return res.status(403).json({
          message:
            'Pracanta lze odebrat pouze více než 4 hodiny před začátkem slotu.',
        })
      }
    }

    try {
      const updated = await logoutFromAdorationSlot(slotId, workerId)
      res.status(200).json(updated)
    } catch (error) {
      console.error('Error unassigning worker from adoration slot:', error)
      res
        .status(500)
        .json({ message: 'Chyba při odebírání pracanta z adoračního slotu.' })
    }
  }
)
