import { NextApiRequest, NextApiResponse } from 'next'
import { getAdorationSlotsForDayAdmin } from 'lib/data/adoration'
import { APIAccessController } from 'lib/api/APIAccessControler'
import { Permission } from 'lib/types/auth'

export default APIAccessController(
  [Permission.ADMIN],
  async function handler(
    req: NextApiRequest,
    res: NextApiResponse,
  ) {
    const { date, eventId } = req.query

    if (!date || !eventId || typeof date !== 'string' || typeof eventId !== 'string') {
      return res.status(400).json({ message: 'Chybí nebo neplatné parametry.' })
    }

    const parsedDate = new Date(date)
    const slots = await getAdorationSlotsForDayAdmin(eventId, parsedDate)

    res.status(200).json(slots)
  }
)
