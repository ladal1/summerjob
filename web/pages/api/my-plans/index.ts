import { APIAccessController } from 'lib/api/APIAccessControler'
import { APIMethodHandler } from 'lib/api/MethodHandler'
import { getActiveEventOrSendError } from 'lib/api/validator'
import { getMyPlans } from 'lib/data/my-plan'
import { ExtendedSession } from 'lib/types/auth'
import { NextApiRequest, NextApiResponse } from 'next'

export type MyPlansAPIGetResponse = Awaited<ReturnType<typeof getMyPlans>>
async function get(
  req: NextApiRequest,
  res: NextApiResponse<MyPlansAPIGetResponse>,
  session: ExtendedSession
) {
  const summerJobEvent = await getActiveEventOrSendError(res)
  if (!summerJobEvent) {
    return
  }

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const plans = await getMyPlans(session!.userID)
  res.status(200).json(plans)
}

export default APIAccessController([], APIMethodHandler({ get }))
