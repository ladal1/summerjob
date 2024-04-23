import { APIAccessController } from 'lib/api/APIAccessControler'
import { getUploadDirForImagesForCurrentEvent } from 'lib/api/fileManager'
import { APIMethodHandler } from 'lib/api/MethodHandler'
import { parseFormWithImages } from 'lib/api/parse-form'
import { validateOrSendError } from 'lib/api/validator'
import { getSMJSessionAPI, isAccessAllowed } from 'lib/auth/auth'
import { deletePost, getPostById, updatePost } from 'lib/data/posts'
import logger from 'lib/logger/logger'
import { ExtendedSession, Permission } from 'lib/types/auth'
import { APILogEvent } from 'lib/types/logger'
import { PostUpdateSchema } from 'lib/types/post'
import { NextApiRequest, NextApiResponse } from 'next'

async function get(req: NextApiRequest, res: NextApiResponse) {
  const id = req.query.id as string
  const post = await getPostById(id)
  if (!post) {
    res.status(404).end()
    return
  }
  res.status(200).json(post)
}

async function patch(req: NextApiRequest, res: NextApiResponse) {
  const id = req.query.id as string
  const post = await getPostById(id)
  if (!post) {
    res.status(404).end()
    return
  }
  const session = await getSMJSessionAPI(req, res)
  const allowed = await isAllowedToAccessPost(session, res)
  if (!allowed) {
    return
  }

  const uploadDir = (await getUploadDirForImagesForCurrentEvent()) + '/posts'
  const { files, json } = await parseFormWithImages(
    req,
    res,
    post.id,
    uploadDir,
    1
  )

  /* Validate simple data from json. */
  const postData = validateOrSendError(PostUpdateSchema, json, res)
  if (!postData) {
    return
  }

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  await logger.apiRequest(APILogEvent.POST_MODIFY, post.id, postData, session!)

  const fileFieldNames = Object.keys(files)
  await updatePost(
    post.id,
    postData,
    fileFieldNames.length !== 0 ? files[fileFieldNames[0]] : undefined
  )

  res.status(204).end()
}

async function del(req: NextApiRequest, res: NextApiResponse) {
  const id = req.query.id as string
  const post = await getPostById(id)
  if (!post) {
    res.status(404).end()
    return
  }
  const session = await getSMJSessionAPI(req, res)
  const allowed = await isAllowedToAccessPost(session, res)
  if (!allowed) {
    return
  }

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  await logger.apiRequest(APILogEvent.POST_DELETE, post.id, {}, session!)
  await deletePost(post.id)

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
  APIMethodHandler({ get, patch, del })
)

export const config = {
  api: {
    bodyParser: false,
  },
}
