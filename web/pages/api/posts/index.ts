import { APIAccessController } from 'lib/api/APIAccessControler'
import {
  generateFileName,
  getUploadDirForImages,
  renameFile,
  updatePhotoPathByNewFilename,
} from 'lib/api/fileManager'
import { APIMethodHandler } from 'lib/api/MethodHandler'
import { getPhotoPath, parseFormWithImages } from 'lib/api/parse-form'
import { validateOrSendError } from 'lib/api/validator'
import { cache_getActiveSummerJobEventId } from 'lib/data/cache'
import { createPost, getPosts, updatePost } from 'lib/data/posts'
import logger from 'lib/logger/logger'
import { ExtendedSession, Permission } from 'lib/types/auth'
import { APILogEvent } from 'lib/types/logger'
import { PostCreateSchema } from 'lib/types/post'
import { NextApiRequest, NextApiResponse } from 'next'

export type PostsAPIGetResponse = Awaited<ReturnType<typeof getPosts>>
async function get(
  req: NextApiRequest,
  res: NextApiResponse<PostsAPIGetResponse>
) {
  const posts = await getPosts()
  res.status(200).json(posts)
}

async function post(
  req: NextApiRequest,
  res: NextApiResponse,
  session: ExtendedSession
) {
  const activeEventId = await cache_getActiveSummerJobEventId()
  const temporaryName = generateFileName(30) // temporary name for the file
  const uploadDir = getUploadDirForImages() + '/' + activeEventId + '/posts'
  console.log('before')
  const { files, json } = await parseFormWithImages(
    req,
    temporaryName,
    uploadDir,
    1
  )
  console.log(json)
  const parsed = PostCreateSchema.safeParse(json)
  if (!parsed.success) {
    parsed.error.issues.map(issue => {
      console.log(issue.code)
      console.log(issue.message)
    })
  } else {
    console.log(parsed.success)
  }

  const singlePost = validateOrSendError(PostCreateSchema, json, res)
  if (!singlePost) {
    return
  }
  console.log(singlePost)
  const { photoFile, ...rest } = singlePost
  const post = await createPost(rest)
  /* Rename photo file and update post with new photo path to it. */
  if (files.photoFile) {
    const temporaryPhotoPath = getPhotoPath(files.photoFile) // update photoPath
    singlePost.photoPath =
      updatePhotoPathByNewFilename(temporaryPhotoPath, post.id) ?? ''
    renameFile(temporaryPhotoPath, singlePost.photoPath)
    await updatePost(post.id, singlePost)
  }
  await logger.apiRequest(APILogEvent.POST_CREATE, 'posts', singlePost, session)
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
