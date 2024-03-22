import { APIAccessController } from 'lib/api/APIAccessControler'
import { deleteFile, getUploadDirForImages } from 'lib/api/fileManager'
import { APIMethodHandler } from 'lib/api/MethodHandler'
import { getPhotoPath, parseFormWithImages } from 'lib/api/parse-form'
import { validateOrSendError } from 'lib/api/validator'
import { getSMJSessionAPI, isAccessAllowed } from 'lib/auth/auth'
import { getGeocodingData } from 'lib/components/map/GeocodingData'
import { cache_getActiveSummerJobEventId } from 'lib/data/cache'
import { getPostPhotoById, updatePost } from 'lib/data/posts'
import logger from 'lib/logger/logger'
import { ExtendedSession, Permission } from 'lib/types/auth'
import { CoordinatesSchema } from 'lib/types/coordinates'
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

  const activeEventId = await cache_getActiveSummerJobEventId()
  const uploadDir = getUploadDirForImages() + '/' + activeEventId + '/posts'
  const { files, json } = await parseFormWithImages(req, id, uploadDir, 1)

  /* Validate simple data from json. */
  const postData = validateOrSendError(PostUpdateSchema, json, res)
  if (!postData) {
    return
  }

  // Set coordinates if they are missing
  if (postData.coordinates === undefined || postData.coordinates.length !== 2) {
    const fetchedCoords = await getGeocodingData(postData.address)
    const parsed = CoordinatesSchema.safeParse({ coordinates: fetchedCoords })
    if (fetchedCoords && parsed.success) {
      postData.coordinates = parsed.data.coordinates
    }
  }

  /* Get photoPath from uploaded photoFile. If there was uploaded image for this post, it will be deleted. */
  if (files.photoFile) {
    const photoPath = getPhotoPath(files.photoFile) // update photoPath
    const post = await getPostPhotoById(id)
    if (post?.photoPath && post?.photoPath !== photoPath) {
      // if original image exists and it is named differently (meaning it wasn't replaced already by parseFormWithImages) delete it
      deleteFile(post.photoPath) // delete original image if necessary
    }
    postData.photoPath = photoPath
  } else if (postData.photoFileRemoved) {
    /* If original file was deleted on client and was not replaced (it is not in files) file should be deleted. */
    const post = await getPostPhotoById(id)
    if (post?.photoPath) {
      deleteFile(post.photoPath) // delete original image if necessary
    }
    postData.photoPath = ''
  }

  await logger.apiRequest(APILogEvent.POST_MODIFY, id, postData, session!)

  const { photoFile, photoFileRemoved, ...rest } = postData
  const t = await updatePost(id, rest)
  console.log(t)

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
  APIMethodHandler({ patch })
)

export const config = {
  api: {
    bodyParser: false,
  },
}
