import { createReadStream, statSync } from 'fs'
import { APIAccessController } from 'lib/api/APIAccessControler'
import { APIMethodHandler } from 'lib/api/MethodHandler'
import { getSMJSessionAPI, isAccessAllowed } from 'lib/auth/auth'
import { getPostPhotoById } from 'lib/data/posts'
import { WrappedError } from 'lib/types/api-error'
import { ExtendedSession, Permission } from 'lib/types/auth'
import type { NextApiRequest, NextApiResponse } from 'next'
import { ApiError } from 'next/dist/server/api-utils'

const get = async (
  req: NextApiRequest,
  res: NextApiResponse<string | WrappedError<ApiError>>
) => {
  const id = req.query.id as string
  const session = await getSMJSessionAPI(req, res)
  const allowed = await isAllowedToAccessPostPhoto(session, res)
  if (!allowed) {
    return
  }

  const post = await getPostPhotoById(id)
  if (!post || !post.photoPath) {
    res.status(404).end()
    return
  }

  const fileStat = statSync(post.photoPath)
  res.writeHead(200, {
    'Content-Type': `image/${post?.photoPath?.split('.').pop()}`,
    'Content-Length': fileStat.size,
    'Cache-Control': 'public, max-age=5, must-revalidate',
  })
  const readStream = createReadStream(post.photoPath)
  readStream.pipe(res)
}

async function isAllowedToAccessPostPhoto(
  session: ExtendedSession | null,
  res: NextApiResponse
) {
  if (!session) {
    res.status(401).end()
    return
  }
  const regularAccess = isAccessAllowed([Permission.POSTS], session)
  if (regularAccess) {
    return true
  }

  res.status(403).end()
  return false
}

export default APIAccessController(
  [Permission.POSTS],
  APIMethodHandler({ get })
)

export const config = {
  api: {
    bodyParser: false,
  },
}
