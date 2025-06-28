import { APIAccessController } from 'lib/api/APIAccessControler'
import { Permission } from 'lib/types/auth'
import { NextApiRequest, NextApiResponse } from 'next'
import { createAdorationSlotsBulk } from 'lib/data/adoration'

export const config = {
  api: {
    bodyParser: false,
  },
}

import { IncomingForm } from 'formidable'

export default APIAccessController(
  [Permission.ADMIN],
  async function handler(
    req: NextApiRequest,
    res: NextApiResponse,
  ) {
    const form = new IncomingForm()

    form.parse(req, async (err, fields) => {
      if (err) {
        return res.status(400).json({ message: 'Chyba při parsování formuláře.' })
      }

      try {
        const rawJson = Array.isArray(fields.jsonData)
          ? fields.jsonData[0]
          : fields.jsonData

        if (typeof rawJson !== 'string') {
          return res.status(400).json({ message: 'Chybí nebo neplatná data.' })
        }

        const parsed = JSON.parse(rawJson)

        const {
          eventId,
          dateFrom,
          dateTo,
          fromHour,
          toHour,
          length,
          location,
          capacity,
          fromMinute = 0,
          toMinute = 0,
        } = parsed

        if (
          !eventId ||
          !dateFrom ||
          !dateTo ||
          fromHour == null ||
          toHour == null ||
          !location ||
          capacity == null
        ) {
          return res.status(400).json({ message: 'Chybí potřebné údaje.' })
        }

        const result = await createAdorationSlotsBulk(
          eventId,
          new Date(dateFrom),
          new Date(dateTo),
          fromHour,
          toHour,
          length,
          location,
          capacity,
          fromMinute,
          toMinute
        )

        res.status(200).json(result)
      } catch (e) {
        res.status(400).json({ message: e })
      }
    })
  }
)
