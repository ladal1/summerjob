import { APIAccessController } from 'lib/api/APIAccessControler'
import { NextApiRequest, NextApiResponse } from 'next'
import { getAdorationSlotsForDayUser, getAllAdorationSlotsForEventUser } from 'lib/data/adoration'
import { ExtendedSession } from 'lib/types/auth'

export default APIAccessController(
  [],
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

    if (dateParam) {
      // If date is provided, return slots for that specific day
      const targetDate = new Date(dateParam)
      const slots = await getAdorationSlotsForDayUser(eventId, targetDate, session.userID)
      return res.status(200).json(slots)
    } else {
      // If no date provided, return all slots for the event
      const slots = await getAllAdorationSlotsForEventUser(eventId, session.userID)
      return res.status(200).json(slots)
    }
  }
)
