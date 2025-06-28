import { APIAccessController } from 'lib/api/APIAccessControler'
import { Permission } from 'lib/types/auth'
import { NextApiRequest, NextApiResponse } from 'next'
import { getAdorationSlotsForDayUser } from 'lib/data/adoration'
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

    if (!dateParam || !eventId || !session.userID) {
      return res.status(400).json({ message: 'Chybí parametry nebo přihlášení uživatel.' })
    }

    const date = new Date(dateParam)
    const slots = await getAdorationSlotsForDayUser(eventId, date, session.userID)

    res.status(200).json(slots)
  }
)
