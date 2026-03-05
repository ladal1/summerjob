import { APIAccessController } from 'lib/api/APIAccessControler'
import { APIMethodHandler } from 'lib/api/MethodHandler'
import { cache_unsetActiveSummerJobEvent } from 'lib/data/cache'
import { Permission } from 'lib/types/auth'
import { NextApiRequest, NextApiResponse } from 'next'

// A test-only endpoint to clear active SMJ event cache
async function post(req: NextApiRequest, res: NextApiResponse) {
  cache_unsetActiveSummerJobEvent()
  res.status(200).end()
}

export default APIAccessController(
  [Permission.ADMIN],
  APIMethodHandler({ post })
)
