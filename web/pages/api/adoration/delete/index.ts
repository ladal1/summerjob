import { APIAccessController } from 'lib/api/APIAccessControler'
import { Permission } from 'lib/types/auth'
import { NextApiRequest, NextApiResponse } from 'next'
import prisma from 'lib/prisma/connection'
import { ExtendedSession } from 'lib/types/auth'

export default APIAccessController(
    [Permission.ADMIN],
    async function handler(req: NextApiRequest, res: NextApiResponse, session: ExtendedSession) {
      const { slotIds } = req.body as { slotIds: string[] }
  
      if (!slotIds?.length) {
        return res.status(400).json({ message: 'Chybí sloty pro smazání.' })
      }
  
      const deleted = await prisma.adorationSlot.deleteMany({
        where: {
          id: { in: slotIds },
        },
      })
  
      res.status(200).json(deleted)
    }
  )
  