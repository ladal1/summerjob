import { APIAccessController } from 'lib/api/APIAccessControler'
import { APIMethodHandler } from 'lib/api/MethodHandler'
import { getArrivalsWorkers } from 'lib/data/arrivals'
import { Permission } from 'lib/types/auth'
import { NextApiRequest, NextApiResponse } from 'next'

export type ArrivalsAPIGetResponse = Awaited<
  ReturnType<typeof getArrivalsWorkers>
>

async function get(req: NextApiRequest, res: NextApiResponse) {
  const workers = await getArrivalsWorkers()
  res.status(200).json(workers)
}

export default APIAccessController(
  [Permission.WORKERS, Permission.ADMIN],
  APIMethodHandler({ get })
)
