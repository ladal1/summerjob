import type { NextApiRequest, NextApiResponse } from 'next'
import { createReadStream, statSync } from 'fs'
import { getSMJSessionAPI, isAccessAllowed } from 'lib/auth/auth'
import { ExtendedSession, Permission } from 'lib/types/auth'
import { APIMethodHandler } from 'lib/api/MethodHandler'
import { getWorkerPhotoById } from 'lib/data/workers'
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

  const worker = await getWorkerPhotoById(id)
  if (!worker || !worker.photoPath) {
    res.status(404).end()
    return
  }

  const fileStat = statSync(worker.photoPath)
  res.writeHead(200, {
    'Content-Type': `image/${worker?.photoPath?.split('.').pop()}`,
    'Content-Length': fileStat.size,
    'Cache-Control': 'public, max-age=5, must-revalidate',
  })
  const readStream = createReadStream(worker.photoPath)
  readStream.pipe(res)
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
