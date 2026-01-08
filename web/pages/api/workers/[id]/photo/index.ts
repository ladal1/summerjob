import type { NextApiRequest, NextApiResponse } from 'next'
import { readFile, stat } from 'fs/promises'
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
      res.status(404).end()
      return
    }

    // Get file stats - this will throw if file doesn't exist
    let fileStat
    try {
      fileStat = await stat(workerPhotoPath)
    } catch (error) {
      console.error(`Photo file not found: ${workerPhotoPath}`, error)
      res.status(404).end()
      return
    }

    // Check if file has content
    if (fileStat.size === 0) {
      console.error(`Photo file is empty: ${workerPhotoPath}`)
      res.status(500).end()
      return
    }

    // Validate actual MIME type by reading file content
    let fileType
    try {
      fileType = await fileTypeFromFile(workerPhotoPath)
    } catch (error) {
      console.error(`Error detecting file type for: ${workerPhotoPath}`, error)
      res.status(500).end()
      return
    }

    if (!fileType || !ALLOWED_IMAGE_MIME_TYPES.includes(fileType.mime)) {
      console.error(
        `Invalid or unsupported image type: ${fileType?.mime || 'unknown'} for file: ${workerPhotoPath}`
      )
      res.status(415).end() // 415 Unsupported Media Type
      return
    }

    // Read the entire file into a buffer
    let fileBuffer
    try {
      fileBuffer = await readFile(workerPhotoPath)
    } catch (error) {
      console.error('Error reading photo file:', error)
      res.status(500).end()
      return
    }

    // Set headers and send the complete buffer
    res.setHeader('Content-Type', fileType.mime)
    res.setHeader('Content-Length', fileBuffer.length)
    res.setHeader('Cache-Control', 'public, max-age=5, must-revalidate')
    res.status(200).end(fileBuffer)
  } catch (error) {
    console.error('Error serving photo:', error)
    if (!res.headersSent) {
      res.status(500).end()
    }
  }
}

async function isAllowedToAccessWorkerPhoto(
  session: ExtendedSession | null,
  res: NextApiResponse
) {
  if (!session) {
    res.status(401).end()
    return
  }
  const regularAccess = isAccessAllowed([Permission.WORKERS], session)
  if (regularAccess) {
    return true
  }

  res.status(403).end()
  return false
}

export default APIMethodHandler({ get })

export const config = {
  api: {
    bodyParser: false,
  },
}
