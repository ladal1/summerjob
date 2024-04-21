import { APIAccessController } from 'lib/api/APIAccessControler'
import { getUploadDirForImagesForCurrentEvent } from 'lib/api/fileManager'
import { APIMethodHandler } from 'lib/api/MethodHandler'
import { parseFormWithImages } from 'lib/api/parse-form'
import { validateOrSendError } from 'lib/api/validator'
import { getSMJSessionAPI, isAccessAllowed } from 'lib/auth/auth'
import { deletePost, updatePost } from 'lib/data/posts'
import logger from 'lib/logger/logger'
import { ExtendedSession, Permission } from 'lib/types/auth'
import { APILogEvent } from 'lib/types/logger'
import { PostUpdateSchema } from 'lib/types/post'
import { NextApiRequest, NextApiResponse } from 'next'

async function patch(req: NextApiRequest, res: NextApiResponse) {
  const id = req.query.id as string
  const session = await getSMJSessionAPI(req, res)
  const allowed = await isAllowedToAccessPost(session, res)
  if (!allowed) {
    return
  }

  const uploadDir = (await getUploadDirForImagesForCurrentEvent()) + '/posts'
  const { files, json } = await parseFormWithImages(req, res, id, uploadDir, 1)

  /* Validate simple data from json. */
  const postData = validateOrSendError(PostUpdateSchema, json, res)
  if (!postData) {
    return
  }

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  await logger.apiRequest(APILogEvent.POST_MODIFY, id, postData, session!)

  const fileFieldNames = Object.keys(files)
  await updatePost(
    id,
    postData,
    fileFieldNames.length !== 0 ? files[fileFieldNames[0]] : undefined
  )

  res.status(204).end()
}

async function del(req: NextApiRequest, res: NextApiResponse) {
  const id = req.query.id as string
  const session = await getSMJSessionAPI(req, res)
  const allowed = await isAllowedToAccessPost(session, res)
  if (!allowed) {
    return
  }

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  await logger.apiRequest(APILogEvent.POST_DELETE, id, {}, session!)
  await deletePost(id)

  res.status(204).end()
}

async function isAllowedToAccessPost(
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
  APIMethodHandler({ patch, del })
)

export const config = {
  api: {
    bodyParser: false,
  },
}
