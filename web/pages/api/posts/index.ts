import {
  generateFileName,
  getUploadDirForImages,
  updatePhotoPathByNewFilename,
  renameFile,
} from 'lib/api/fileManager'
import { APIMethodHandler } from 'lib/api/MethodHandler'
import { parseFormWithImages, getPhotoPath } from 'lib/api/parse-form'
import { validateOrSendError } from 'lib/api/validator'
import { cache_getActiveSummerJobEventId } from 'lib/data/cache'
import { createPost, getPosts, updatePost } from 'lib/data/posts'
import { ExtendedSession } from 'lib/types/auth'
import { APILogEvent } from 'lib/types/logger'
import { PostCreateDataInput, PostCreateSchema } from 'lib/types/post'
import { NextApiRequest, NextApiResponse } from 'next'
import logger from 'next-auth/utils/logger'

export type PostsAPIGetResponse = Awaited<ReturnType<typeof getPosts>>
async function get(
  req: NextApiRequest,
  res: NextApiResponse<PostsAPIGetResponse>
) {
  const posts = await getPosts()
  res.status(200).json(posts)
}

export type PostAPIPostData = PostCreateDataInput
async function post(
  req: NextApiRequest,
  res: NextApiResponse,
  session: ExtendedSession
) {
  const activeEventId = await cache_getActiveSummerJobEventId()
  const temporaryName = generateFileName(30) // temporary name for the file
  const uploadDir = getUploadDirForImages() + '/' + activeEventId + '/posts'
  const { files, json } = await parseFormWithImages(
    req,
    temporaryName,
    uploadDir,
    1
  )

  const singlePost = validateOrSendError(PostCreateSchema, json, res)
  if (!singlePost) {
    return
  }
  const post = await createPost(singlePost)
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

export default APIMethodHandler({ get, post })

export const config = {
  api: {
    bodyParser: false,
  },
}
