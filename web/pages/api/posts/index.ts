import { APIAccessController } from 'lib/api/APIAccessControler'
import { generateFileName, getPostsUploadDir } from 'lib/api/fileManager'
import { APIMethodHandler } from 'lib/api/MethodHandler'
import { parseFormWithImages } from 'lib/api/parse-form'
import { validateOrSendError } from 'lib/api/validator'
import { createPost, getPosts } from 'lib/data/posts'
import logger from 'lib/logger/logger'
import { ExtendedSession, Permission } from 'lib/types/auth'
import { APILogEvent } from 'lib/types/logger'
import { PostCreateSchema } from 'lib/types/post'
import { NextApiRequest, NextApiResponse } from 'next'

export type PostsAPIGetResponse = Awaited<ReturnType<typeof getPosts>>
async function get(
  _req: NextApiRequest,
  res: NextApiResponse<PostsAPIGetResponse>
) {
  const posts = await getPosts()
  posts.map(post => post.availability.map(a => new Date(a)))
  res.status(200).json(posts)
}

async function post(
  req: NextApiRequest,
  res: NextApiResponse,
  session: ExtendedSession
) {
  const temporaryName = generateFileName(30) // temporary name for the file
  const uploadDir = await getPostsUploadDir()
  const { files, json } = await parseFormWithImages(
    req,
    res,
    temporaryName,
    uploadDir,
    1
  )

  const postData = validateOrSendError(PostCreateSchema, json, res)
  if (!postData) {
    return
  }

  const fileFieldNames = Object.keys(files)
  const post = await createPost(
    postData,
    fileFieldNames.length !== 0 ? files[fileFieldNames[0]] : undefined
  )

  await logger.apiRequest(APILogEvent.POST_CREATE, 'posts', postData, session)
  res.status(201).json(post)
}

export default APIAccessController(
  [Permission.POSTS],
  APIMethodHandler({ get, post })
)

export const config = {
  api: {
    bodyParser: false,
  },
}
