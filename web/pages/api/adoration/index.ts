import { APIAccessController } from 'lib/api/APIAccessControler'
import { Permission } from 'lib/types/auth'
import { NextApiRequest, NextApiResponse } from 'next'
import { getAdorationSlotsForDayUser, findNearestDateWithAdorationSlots } from 'lib/data/adoration'
import { ExtendedSession } from 'lib/types/auth'

export default APIAccessController(
  [Permission.ADORATION],
  async function handler(
    req: NextApiRequest,
    res: NextApiResponse,
    session: ExtendedSession
  ) {
    const dateParam = req.query.date as string
    const eventId = req.query.eventId as string

    if (!eventId || !session.userID) {
      return res.status(400).json({ message: 'Chybí eventId nebo přihlášený uživatel.' })
    }

    let targetDate: Date

    if (dateParam) {
      targetDate = new Date(dateParam)
    } else {
      // If no date provided, find the nearest date with adoration slots
      const today = new Date()
      const nearestDateStr = await findNearestDateWithAdorationSlots(eventId, today)
      
      if (!nearestDateStr) {
        return res.status(200).json([]) // No slots found
      }
      
      targetDate = new Date(nearestDateStr)
    }

    const slots = await getAdorationSlotsForDayUser(eventId, targetDate, session.userID)

    res.status(200).json(slots)
  }
)
