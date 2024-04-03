import { APIAccessController } from 'lib/api/APIAccessControler'
import { APIMethodHandler } from 'lib/api/MethodHandler'
import { getActiveEventOrSendError } from 'lib/api/validator'
import { getMyEvents } from 'lib/data/my-events'
import { ExtendedSession } from 'lib/types/auth'
import { NextApiRequest, NextApiResponse } from 'next'

export type MyEventsAPIGetResponse = Awaited<ReturnType<typeof getMyEvents>>
async function get(
  req: NextApiRequest,
  res: NextApiResponse<MyEventsAPIGetResponse>,
  session: ExtendedSession
) {
  const summerJobEvent = await getActiveEventOrSendError(res)
  if (!summerJobEvent) {
    return
  }
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const plans = await getMyEvents(session!.userID)
  res.status(200).json(plans)
}

export default APIAccessController([], APIMethodHandler({ get }))
