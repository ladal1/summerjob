import { APIAccessController } from 'lib/api/APIAccessControler'
import { Permission } from 'lib/types/auth'
import { NextApiRequest, NextApiResponse } from 'next'
import { signUpForAdorationSlot } from 'lib/data/adoration'
import { ExtendedSession } from 'lib/types/auth'

export default APIAccessController(
    [Permission.ADORATION],
    async function handler(
        req: NextApiRequest,
        res: NextApiResponse,
        session: ExtendedSession
    ) {
        const slotId = req.query.id as string
        if (!slotId || !session.userID) {
            return res.status(400).json({ message: 'Chybí slot nebo přihlášený uživatel.' })
        }

        const updated = await signUpForAdorationSlot(slotId, session.userID)
        res.status(200).json(updated)
    }
)
