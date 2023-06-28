import type { NextApiRequest, NextApiResponse } from 'next'
import { parseForm, FormidableError } from 'lib/api/parse-form'
import prisma from 'lib/prisma/connection'
import { PrismaClient } from 'lib/prisma/client'

const handler = async (
  req: NextApiRequest,
  res: NextApiResponse<{
    data: string | null
    error: string | null
  }>
) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    res.status(405).json({
      data: null,
      error: 'Method Not Allowed',
    })
    return
  }
  try {
    const { files } = await parseForm(req)
    if (!files.photo) {
      return res.status(400).json({
        data: null,
        error: 'No photo provided',
      })
    }

    const filePath = Array.isArray(files.photo)
      ? files.photo[0].filepath
      : files.photo.filepath

    prisma.worker.update({
      where: {
        id: req.query.id as string,
      },
      data: {
        photoPath: filePath,
      },
    })

    res.status(200).json({
      data: 'File successfully uploaded',
      error: null,
    })
  } catch (e) {
    if (e instanceof FormidableError) {
      res.status(e.httpCode || 400).json({ data: null, error: e.message })
    } else {
      console.error(e)
      res.status(500).json({ data: null, error: 'Internal Server Error' })
    }
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
}

export default handler
