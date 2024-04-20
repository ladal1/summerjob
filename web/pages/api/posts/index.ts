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
import { getGeocodingData } from 'lib/components/map/GeocodingData'
import { cache_getActiveSummerJobEventId } from 'lib/data/cache'
import { createPost, getPosts, updatePost } from 'lib/data/posts'
import logger from 'lib/logger/logger'
import { ExtendedSession, Permission } from 'lib/types/auth'
import { CoordinatesSchema } from 'lib/types/coordinates'
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
  const activeEventId = await cache_getActiveSummerJobEventId()
  const temporaryName = generateFileName(30) // temporary name for the file
  const uploadDir = getUploadDirForImages() + '/' + activeEventId + '/posts'
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

  // Set coordinates if they are missing
  if (postData.coordinates === undefined) {
    const fetchedCoords = await getGeocodingData(postData.address ?? undefined)
    const parsed = CoordinatesSchema.safeParse({ coordinates: fetchedCoords })
    if (fetchedCoords && parsed.success) {
      postData.coordinates = parsed.data.coordinates
    }
  }

  const post = await createPost(postData)

  /* Rename photo file and update post with new photo path to it. */
  if (files.photoFile) {
    const temporaryPhotoPath = getPhotoPath(files.photoFile) // update photoPath
    postData.photoPath =
      updatePhotoPathByNewFilename(temporaryPhotoPath, post.id) ?? ''
    await renameFile(temporaryPhotoPath, postData.photoPath)
    await updatePost(post.id, postData)
  }
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
