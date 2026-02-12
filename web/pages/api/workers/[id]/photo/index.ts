import type { NextApiRequest, NextApiResponse } from 'next'
import { createReadStream } from 'fs'
import { stat } from 'fs/promises'
import { getSMJSessionAPI, isAccessAllowed } from 'lib/auth/auth'
import { ExtendedSession, Permission } from 'lib/types/auth'
import { APIMethodHandler } from 'lib/api/MethodHandler'
import { getWorkerPhotoPathById } from 'lib/data/workers'
import { fileTypeFromFile } from 'file-type'

// Whitelist of allowed image MIME types
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
  const allowed = await isAllowedToAccessWorkerPhoto(session, res)
  if (!allowed) {
    return
  }

  try {
    const workerPhotoPath = await getWorkerPhotoPathById(id)
    if (!workerPhotoPath) {
      res.status(404).json({ error: 'Photo not found' })
      return
    }

    // Get file stats - this will throw if file doesn't exist
    let fileStat
    try {
      fileStat = await stat(workerPhotoPath)
    } catch {
      console.log(`Photo file not found: ${workerPhotoPath}`)
      res.status(404).json({ error: 'Photo file not found' })
      return
    }

    // Check if file has content
    if (fileStat.size === 0) {
      console.log(`Photo file is empty: ${workerPhotoPath}`)
      res.status(404).json({ error: 'Photo file is empty' })
      return
    }

    // Validate actual MIME type by reading file content
    let fileType
    try {
      fileType = await fileTypeFromFile(workerPhotoPath)
    } catch (error) {
      console.error(`Error detecting file type for: ${workerPhotoPath}`, error)
      res.status(500).json({ error: 'Error detecting file type' })
      return
    }

    if (!fileType || !ALLOWED_IMAGE_MIME_TYPES.includes(fileType.mime)) {
      console.log(
        `Unsupported image type: ${fileType?.mime || 'unknown'} for ${workerPhotoPath}`
      )
      res.status(415).json({ error: 'Unsupported image type' }) // 415 Unsupported Media Type
      return
    }

    // Set headers before streaming
    res.setHeader('Content-Type', fileType.mime)
    res.setHeader('Content-Length', fileStat.size.toString())
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
    res.status(200)

    // Stream the file to the response
    const fileStream = createReadStream(workerPhotoPath)

    fileStream.on('error', error => {
      console.error('Error streaming photo file:', error)
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

async function isAllowedToAccessWorkerPhoto(
  session: ExtendedSession | null,
  res: NextApiResponse
) {
  if (!session) {
    res.status(401).json({ error: 'Unauthorized' })
    return false
  }
  const regularAccess = isAccessAllowed([Permission.WORKERS], session)
  if (regularAccess) {
    return true
  }

  res.status(403).json({ error: 'Forbidden' })
  return false
}

export default APIMethodHandler({ get })

export const config = {
  api: {
    bodyParser: false,
  },
}
