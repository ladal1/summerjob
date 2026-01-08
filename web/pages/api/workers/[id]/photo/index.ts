import type { NextApiRequest, NextApiResponse } from 'next'
import { createReadStream, existsSync, statSync } from 'fs'
import { getSMJSessionAPI, isAccessAllowed } from 'lib/auth/auth'
import { ExtendedSession, Permission } from 'lib/types/auth'
import { APIMethodHandler } from 'lib/api/MethodHandler'
import { getWorkerPhotoPathById } from 'lib/data/workers'
import { WrappedError } from 'lib/types/api-error'
import { ApiError } from 'next/dist/server/api-utils'

const get = async (
  req: NextApiRequest,
  res: NextApiResponse<string | WrappedError<ApiError>>
) => {
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

    // Check if file exists before trying to stat it
    if (!existsSync(workerPhotoPath)) {
      console.error(`Photo file not found: ${workerPhotoPath}`)
      res.status(404).end()
      return
    }

    const fileStat = statSync(workerPhotoPath)

    // Check if file has content
    if (fileStat.size === 0) {
      console.error(`Photo file is empty: ${workerPhotoPath}`)
      res.status(500).end()
      return
    }

    // Set headers before creating stream
    res.setHeader('Content-Type', `image/${workerPhotoPath.split('.').pop()}`)
    res.setHeader('Content-Length', fileStat.size)
    res.setHeader('Cache-Control', 'public, max-age=5, must-revalidate')
    res.status(200)

    const readStream = createReadStream(workerPhotoPath)

    // Handle stream errors
    readStream.on('error', error => {
      console.error('Error reading photo file:', error)
      if (!res.headersSent) {
        res.status(500).end()
      }
    })

    readStream.pipe(res)
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
