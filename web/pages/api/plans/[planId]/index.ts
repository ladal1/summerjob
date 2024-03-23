import { APIAccessController } from 'lib/api/APIAccessControler'
import { APIMethodHandler } from 'lib/api/MethodHandler'
import { deletePlan, getPlanById, updatePlanById } from 'lib/data/plans'
import logger from 'lib/logger/logger'
import { ExtendedSession, Permission } from 'lib/types/auth'
import { APILogEvent } from 'lib/types/logger'
import { NextApiRequest, NextApiResponse } from 'next'

export type PlanAPIGetResponse = Awaited<ReturnType<typeof getPlanById>>
async function get(
  req: NextApiRequest,
  res: NextApiResponse<PlanAPIGetResponse>
) {
  const id = req.query.planId as string
  const plan = await getPlanById(id)
  if (!plan) {
    res.status(404).end()
    return
  }
  res.status(200).json(plan)
}

async function patch(
  req: NextApiRequest,
  res: NextApiResponse<Awaited<ReturnType<typeof updatePlanById>>>,
  session: ExtendedSession
) {
  const id = req.query.planId as string
  await logger.apiRequest(APILogEvent.PLAN_UPDATE, id, req.body, session)
  const plan = await updatePlanById(id, req.body)
  if (!plan) {
    res.status(404).end()
    return
  }
  res.status(200).json(plan)
}

async function del(
  req: NextApiRequest,
  res: NextApiResponse,
  session: ExtendedSession
) {
  const id = req.query.planId as string
  await logger.apiRequest(APILogEvent.PLAN_DELETE, id, req.body, session)
  await deletePlan(id)
  res.status(204).end()
}

export default APIAccessController(
  [Permission.PLANS],
  APIMethodHandler({ get, del, patch })
)
