import { getSMJSessionAPI, isAccessAllowed } from 'lib/auth/auth'
import { APIMethod } from 'lib/types/api'
import { Permission } from 'lib/types/auth'

export function APIAccessController(
  permissions: Permission[],
  handler: APIMethod
): APIMethod {
  return async (req, res) => {
    const session = await getSMJSessionAPI(req, res)
    if (!session) {
      res.status(403).end()
      return
    }

    if (!isAccessAllowed(permissions, session)) {
      res.status(403).end()
      return
    }

    await handler(req, res, session)
  }
}
