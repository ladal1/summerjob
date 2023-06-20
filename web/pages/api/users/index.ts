import { APIAccessController } from 'lib/api/APIAccessControler'
import { APIMethodHandler } from 'lib/api/MethodHandler'
import { getUsers } from 'lib/data/users'
import { Permission } from 'lib/types/auth'
import { NextApiRequest, NextApiResponse } from 'next'

export type UsersAPIGetResponse = Awaited<ReturnType<typeof getUsers>>
async function get(
  req: NextApiRequest,
  res: NextApiResponse<UsersAPIGetResponse>
) {
  const users = await getUsers()
  res.status(200).json(users)
}

export default APIAccessController(
  [Permission.ADMIN],
  APIMethodHandler({ get })
)
