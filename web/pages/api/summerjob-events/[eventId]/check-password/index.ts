import { APIMethodHandler } from 'lib/api/MethodHandler'
import { NextApiRequest, NextApiResponse } from 'next'
import { checkApplicationPassword } from 'lib/data/summerjob-event'

async function post(req: NextApiRequest, res: NextApiResponse) {
  const eventId = req.query.eventId as string
  const { password } = req.body

  try {
    const isValid = await checkApplicationPassword(eventId, password)
    res.status(200).json({ valid: isValid })
  } catch (err: unknown) {
    console.error(err)

    let message = 'Chyba při ověřování hesla'

    if (err instanceof Error) {
      message = err.message
    }

    res.status(400).json({ message })
  }
}

export default APIMethodHandler({ post })
