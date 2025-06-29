import { APIAccessController } from 'lib/api/APIAccessControler'
import { Permission } from 'lib/types/auth'
import { NextApiRequest, NextApiResponse } from 'next'
import { signUpForAdorationSlot } from 'lib/data/adoration'

export default APIAccessController(
  [Permission.ADMIN, Permission.ADORATION],
  async function handler(
    req: NextApiRequest,
    res: NextApiResponse,
  ) {
    if (req.method !== 'PATCH') {
      return res.status(405).json({ message: 'Method not allowed' })
    }

    const slotId = req.query.id as string
    const { workerId } = req.body

    if (!slotId || !workerId) {
      return res.status(400).json({ message: 'Chybí slot ID nebo worker ID.' })
    }

    try {
      const updated = await signUpForAdorationSlot(slotId, workerId)
      res.status(200).json(updated)
    } catch (error) {
      console.error('Error assigning worker to adoration slot:', error)
      res.status(500).json({ message: 'Chyba při přiřazování pracanta na adorační slot.' })
    }
  }
)
