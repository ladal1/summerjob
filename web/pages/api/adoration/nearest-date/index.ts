import { APIAccessController } from 'lib/api/APIAccessControler'
import { NextApiRequest, NextApiResponse } from 'next'
import { findNearestDateWithAdorationSlots } from 'lib/data/adoration'

export default APIAccessController(
  [],
  async function handler(
    req: NextApiRequest,
    res: NextApiResponse
  ) {
    const { eventId, fromDate } = req.query

    if (!eventId || !fromDate || typeof eventId !== 'string' || typeof fromDate !== 'string') {
      return res.status(400).json({ message: 'Chybí eventId nebo fromDate parametr.' })
    }

    const date = new Date(fromDate)
    if (isNaN(date.getTime())) {
      return res.status(400).json({ message: 'Neplatný formát data.' })
    }

    const nearestDate = await findNearestDateWithAdorationSlots(eventId, date)

    res.status(200).json({ nearestDate })
  }
)
