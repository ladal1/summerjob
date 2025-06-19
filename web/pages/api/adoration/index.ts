import { APIAccessController } from 'lib/api/APIAccessControler'
import { Permission } from 'lib/types/auth'
import { NextApiRequest, NextApiResponse } from 'next'
import { getAdorationSlotsForDay } from 'lib/data/adoration'

export default APIAccessController(
  [Permission.ADORATION],
  async function handler(req: NextApiRequest, res: NextApiResponse) {
    const dateParam = req.query.date as string
    const eventId = req.query.eventId as string

    if (!dateParam || !eventId) {
      return res.status(400).json({ message: 'Chybí datum nebo ID ročníku.' })
    }

    const date = new Date(dateParam)
    const slots = await getAdorationSlotsForDay(eventId, date)

    res.status(200).json(slots)
  }
)
