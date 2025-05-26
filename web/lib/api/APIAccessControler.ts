import { getSMJSessionAPI, isAccessAllowed } from 'lib/auth/auth'
import { APIMethod } from 'lib/types/api'
import { Permission } from 'lib/types/auth'

export function APIAccessController(
  permissions:
    | {
        [key in 'GET' | 'POST' | 'PATCH' | 'DELETE' | 'PUT']?: Permission[]
      }
    | Permission[],
  handler: APIMethod
): APIMethod {
  return async (req, res) => {
    const session = await getSMJSessionAPI(req, res)
    if (!session) {
      res.status(403).end()
      return
    }

    const allowedPermissions = Array.isArray(permissions)
      ? permissions
      : permissions[req.method as keyof typeof permissions] ?? []

    if (!isAccessAllowed(allowedPermissions, session)) {
      res.status(403).end()
      return
    }

    await handler(req, res, session)
  }
}
