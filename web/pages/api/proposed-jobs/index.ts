import { APIAccessController } from 'lib/api/APIAccessControler'
import { generateFileName, getUploadDirForImages } from 'lib/api/fileManager'
import { APIMethodHandler } from 'lib/api/MethodHandler'
import { parseFormWithImages } from 'lib/api/parse-form'
import { registerPhotos } from 'lib/api/register/registerPhotos'
import { validateOrSendError } from 'lib/api/validator'
import { getGeocodingData } from 'lib/components/map/GeocodingData'
import { cache_getActiveSummerJobEventId } from 'lib/data/cache'
import {
  createProposedJob,
  getProposedJobs,
  getProposedJobsAssignableTo,
} from 'lib/data/proposed-jobs'
import logger from 'lib/logger/logger'
import { ApiError, WrappedError } from 'lib/types/api-error'
import { ExtendedSession, Permission } from 'lib/types/auth'
import { CoordinatesSchema } from 'lib/types/coordinates'
import { APILogEvent } from 'lib/types/logger'
import {
  ProposedJobCreateData,
  ProposedJobCreateSchema,
} from 'lib/types/proposed-job'
import { NextApiRequest, NextApiResponse } from 'next'

export type ProposedJobsAPIGetResponse = Awaited<
  ReturnType<typeof getProposedJobs>
>
async function get(
  req: NextApiRequest,
  res: NextApiResponse<ProposedJobsAPIGetResponse>
) {
  const { assignableToPlan } = req.query
  let jobs
  if (assignableToPlan && typeof assignableToPlan === 'string') {
    jobs = await getProposedJobsAssignableTo(assignableToPlan)
  } else {
    jobs = await getProposedJobs()
  }
  res.status(200).json(jobs)
}

export type ProposedJobsAPIPostData = ProposedJobCreateData
export type ProposedJobsAPIPostResponse = Awaited<
  ReturnType<typeof createProposedJob>
>
async function post(
  req: NextApiRequest,
  res: NextApiResponse<ProposedJobsAPIPostResponse | WrappedError<ApiError>>,
  session: ExtendedSession
) {
  const activeEventId = await cache_getActiveSummerJobEventId()
  const temporaryName = generateFileName(30) // temporary name for the file
  const uploadDirectory =
    getUploadDirForImages() + '/' + activeEventId + '/proposed-job'
  const { files, json } = await parseFormWithImages(
    req,
    res,
    temporaryName,
    uploadDirectory,
    10
  )

  const result = validateOrSendError(ProposedJobCreateSchema, json, res)
  if (!result) {
    return
  }

  // Set coordinates if they are missing
  if (result.coordinates === undefined) {
    const fetchedCoords = await getGeocodingData(result.address)
    const parsed = CoordinatesSchema.safeParse({ coordinates: fetchedCoords })
    if (fetchedCoords && parsed.success) {
      result.coordinates = parsed.data.coordinates
    }
  }

  await logger.apiRequest(
    APILogEvent.JOB_CREATE,
    'proposed-jobs',
    result,
    session
  )
  const job = await createProposedJob(result)

  await registerPhotos(files, undefined, uploadDirectory, job.id, session)

  res.status(201).json(job)
}

export default APIAccessController(
  [Permission.JOBS, Permission.PLANS],
  APIMethodHandler({ get, post })
)

export const config = {
  api: {
    bodyParser: false,
  },
}
