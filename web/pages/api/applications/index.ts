import { getApplicationsPaginated } from 'lib/data/applications'
import { APIAccessController } from 'lib/api/APIAccessControler'
import { Permission } from 'lib/types/auth'
import { NextApiRequest, NextApiResponse } from 'next'

export default APIAccessController(
  [Permission.APPLICATIONS],
  async function handler(req: NextApiRequest, res: NextApiResponse) {
    const page = parseInt(req.query.page as string) || 1
    const perPage = parseInt(req.query.perPage as string) || 10
    const status = req.query.status as
      | 'PENDING'
      | 'ACCEPTED'
      | 'REJECTED'
      | undefined
    const search = req.query.search as string | undefined

    const result = await getApplicationsPaginated(page, perPage, status, search)

    res.status(200).json(result)
  }
)

export type ApplicationsPaginatedResponse = Awaited<
  ReturnType<typeof getApplicationsPaginated>
>
