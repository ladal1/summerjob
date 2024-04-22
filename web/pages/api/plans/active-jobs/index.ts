import { APIAccessController } from 'lib/api/APIAccessControler'
import { APIMethodHandler } from 'lib/api/MethodHandler'
import { getActiveEventOrSendError } from 'lib/api/validator'
import { getActiveJobs } from 'lib/data/active-jobs'
import { Permission } from 'lib/types/auth'
import { NextApiRequest, NextApiResponse } from 'next'

export type ActiveJobsAPIGetResponse = Awaited<ReturnType<typeof getActiveJobs>>
async function get(
  req: NextApiRequest,
  res: NextApiResponse<ActiveJobsAPIGetResponse>
) {
  if (!(await getActiveEventOrSendError(res))) {
    return
  }
  const jobs = await getActiveJobs()
  res.status(200).json(jobs)
}

export default APIAccessController(
  [Permission.PLANS],
  APIMethodHandler({ get })
)

export const config = {
  api: {
    bodyParser: false,
  },
}
