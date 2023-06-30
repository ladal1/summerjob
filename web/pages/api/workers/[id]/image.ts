import type { NextApiRequest, NextApiResponse } from 'next'
import { parseForm, FormidableError } from 'lib/api/parse-form'
import prisma from 'lib/prisma/connection'
import { createReadStream, statSync } from 'fs'
import { Prisma } from 'lib/prisma/client'

const getHandler = async (
  req: NextApiRequest,
  res: NextApiResponse<{
    data: string | null
    error: string | null
  }>
) => {
  const worker = await prisma.worker.findUnique({
    where: {
      id: req.query.id as string,
    },
    select: {
      photoPath: true,
    },
  })
  if (!worker || !worker.photoPath) {
    return res.status(404).json({
      data: null,
      error: 'Worker or image not found',
    })
  }
  const fileStat = statSync(worker.photoPath)

  res.writeHead(200, {
    'Content-Type': `image/${worker?.photoPath?.split('.').pop()}`,
    'Content-Length': fileStat.size,
  })
  const readStream = createReadStream(worker.photoPath)
  readStream.pipe(res)
}

const postHandler = async (
  req: NextApiRequest,
  res: NextApiResponse<{
    data: string | null
    error: string | null
  }>
) => {
  try {
    await prisma.worker.findUniqueOrThrow({
      where: {
        id: req.query.id as string,
      },
    })

    const { files } = await parseForm(req)
    if (!files.image) {
      return res.status(400).json({
        data: null,
        error: 'No photo provided',
      })
    }

    const filePath = Array.isArray(files.image)
      ? files.image[0].filepath
      : files.image.filepath

    await prisma.worker.update({
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
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      res.status(404).json({ data: null, error: 'Worker not found' })
      return
    }
    if (e instanceof FormidableError) {
      res.status(e.httpCode || 400).json({ data: null, error: e.message })
      return
    }
    console.error(e)
    res.status(500).json({ data: null, error: 'Internal Server Error' })
  }
}

const handler = async (
  req: NextApiRequest,
  res: NextApiResponse<{
    data: string | null
    error: string | null
  }>
) => {
  switch (req.method) {
    case 'GET':
      return getHandler(req, res)
    case 'POST':
      return postHandler(req, res)
    default:
      res.setHeader('Allow', 'GET, POST')
      res.status(405).json({
        data: null,
        error: 'Method Not Allowed',
      })
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
}

export default handler
