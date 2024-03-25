import { APIAccessController } from 'lib/api/APIAccessControler'
import { APIMethodHandler } from 'lib/api/MethodHandler'
import { getUploadDirForImages } from 'lib/api/fileManager'
import { parseFormWithImages } from 'lib/api/parse-form'
import { registerPhotos } from 'lib/api/register/registerPhotos'
import { ToolType, registerTools } from 'lib/api/register/registerTools'
import { validateOrSendError } from 'lib/api/validator'
import { getGeocodingData } from 'lib/components/map/GeocodingData'
import { cache_getActiveSummerJobEventId } from 'lib/data/cache'
import {
  deleteProposedJob,
  getProposedJobById,
  getProposedJobPhotoIdsById,
  updateProposedJob,
} from 'lib/data/proposed-jobs'
import logger from 'lib/logger/logger'
import { ExtendedSession, Permission } from 'lib/types/auth'
import { CoordinatesSchema } from 'lib/types/coordinates'
import { APILogEvent } from 'lib/types/logger'
import {
  ProposedJobUpdateDataInput,
  ProposedJobUpdateSchema,
} from 'lib/types/proposed-job'
import { NextApiRequest, NextApiResponse } from 'next'

async function get(
  req: NextApiRequest,
  res: NextApiResponse,
  session: ExtendedSession
) {
  const id = req.query.id as string
  const job = await getProposedJobById(id)
  if (!job) {
    res.status(404).end()
    return
  }
  res.status(200).json(job)
}

export type ProposedJobAPIPatchData = ProposedJobUpdateDataInput
async function patch(
  req: NextApiRequest,
  res: NextApiResponse,
  session: ExtendedSession
) {
  const id = req.query.id as string

  // Get current photoIds
  const currentPhotoIds = await getProposedJobPhotoIdsById(id)
  const currentPhotoCnt = currentPhotoIds?.photos.length ?? 0
  const activeEventId = await cache_getActiveSummerJobEventId()
  const uploadDirectory =
    getUploadDirForImages() + '/' + activeEventId + '/proposed-job'

  const { files, json } = await parseFormWithImages(
    req,
    id,
    uploadDirectory,
    10 - currentPhotoCnt
  )

  const proposedJobData = validateOrSendError(
    ProposedJobUpdateSchema,
    json,
    res
  )
  if (!proposedJobData) {
    return
  }

  // Set coordinates if they are missing
  if (proposedJobData.coordinates === undefined) {
    const fetchedCoords = await getGeocodingData(proposedJobData.address)
    const parsed = CoordinatesSchema.safeParse({ coordinates: fetchedCoords })
    if (fetchedCoords && parsed.success) {
      proposedJobData.coordinates = parsed.data.coordinates
    }
  }

  const {
    photoIdsDeleted,
    toolsOnSiteCreate,
    toolsOnSiteIdsDeleted,
    toolsToTakeWithCreate,
    toolsToTakeWithIdsDeleted,
    ...rest
  } = proposedJobData
  await logger.apiRequest(APILogEvent.JOB_MODIFY, id, proposedJobData, session)
  await updateProposedJob(id, rest)

  await registerPhotos(files, photoIdsDeleted, uploadDirectory, id, session)
  await registerTools(
    toolsOnSiteCreate,
    toolsOnSiteIdsDeleted,
    id,
    ToolType.ON_SITE,
    session
  )
  await registerTools(
    toolsToTakeWithCreate,
    toolsToTakeWithIdsDeleted,
    id,
    ToolType.TO_TAKE_WITH,
    session
  )

  res.status(204).end()
}

async function del(
  req: NextApiRequest,
  res: NextApiResponse,
  session: ExtendedSession
) {
  const id = req.query.id as string
  await logger.apiRequest(APILogEvent.JOB_DELETE, id, {}, session)
  await deleteProposedJob(id)
  res.status(204).end()
}

export default APIAccessController(
  [Permission.JOBS],
  APIMethodHandler({ get, patch, del })
)

export const config = {
  api: {
    bodyParser: false,
  },
}
