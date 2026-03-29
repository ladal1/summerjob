import { APIMethodHandler } from 'lib/api/MethodHandler'
import { NextApiRequest, NextApiResponse } from 'next'
import { checkReceptionPassword } from 'lib/data/summerjob-event'

async function post(req: NextApiRequest, res: NextApiResponse) {
  const { password } = req.body

  try {
    if (typeof password !== 'string') {
      throw new Error('Heslo musí být string')
    }
    const isValid = await checkReceptionPassword(password)
    if (!isValid) {
      throw new Error('Zadali jste nesprávné heslo')
    }
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
