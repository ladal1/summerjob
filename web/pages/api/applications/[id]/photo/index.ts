import type { NextApiRequest, NextApiResponse } from 'next'
import { createReadStream } from 'fs'
import { stat } from 'fs/promises'
import { getSMJSessionAPI, isAccessAllowed } from 'lib/auth/auth'
import { ExtendedSession, Permission } from 'lib/types/auth'
import { APIMethodHandler } from 'lib/api/MethodHandler'
import { getApplicationPhotoPathById } from 'lib/data/applications'
import { fileTypeFromFile } from 'file-type'

const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/bmp',
  'image/tiff',
]

const get = async (req: NextApiRequest, res: NextApiResponse) => {
  const id = req.query.id as string
  const session = await getSMJSessionAPI(req, res)
  const allowed = await isAllowedToAccessApplicationPhoto(session, res)
  if (!allowed) {
    return
  }

  try {
    const photoPath = await getApplicationPhotoPathById(id)
    if (!photoPath) {
      res.status(404).json({ error: 'Photo not found' })
      return
    }

    let fileStat
    try {
      fileStat = await stat(photoPath)
    } catch {
      console.log(`Photo file not found: ${photoPath}`)
      res.status(404).json({ error: 'Photo file not found' })
      return
    }

    if (fileStat.size === 0) {
      console.error(`Photo file is empty: ${photoPath}`)
      res.status(404).json({ error: 'Photo file is empty' })
      return
    }

    let fileType
    try {
      fileType = await fileTypeFromFile(photoPath)
    } catch {
      console.error(`Error detecting file type for: ${photoPath}`)
      res.status(500).json({ error: 'Error detecting file type' })
      return
    }

    if (!fileType || !ALLOWED_IMAGE_MIME_TYPES.includes(fileType.mime)) {
      console.error(
        `Invalid or unsupported image type: ${fileType?.mime || 'unknown'} for file: ${photoPath}`
      )
      res.status(415).json({ error: 'Unsupported image type' })
      return
    }

    res.setHeader('Content-Type', fileType.mime)
    res.setHeader('Content-Length', fileStat.size)
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')

    const fileStream = createReadStream(photoPath)
    fileStream.on('error', err => {
      console.error('Error streaming photo:', err)
      if (!res.headersSent) {
        res.status(500).json({ error: 'Error streaming photo' })
      }
    })
    fileStream.pipe(res)
  } catch (error) {
    console.error('Error serving photo:', error)
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error' })
    }
  }
}

async function isAllowedToAccessApplicationPhoto(
  session: ExtendedSession | null,
  res: NextApiResponse
) {
  if (!session) {
    res.status(401).json({ error: 'Unauthorized' })
    return false
  }
  const access = isAccessAllowed([Permission.APPLICATIONS], session)
  if (access) return true

  res.status(403).json({ error: 'Forbidden' })
  return false
}

export default APIMethodHandler({ get })

export const config = {
  api: {
    bodyParser: false,
  },
}
