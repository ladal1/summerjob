import { ExtendedSession, Permission, UserSession } from 'lib/types/auth'
import { NextApiRequest, NextApiResponse } from 'next'
import { Session } from 'next-auth'
import { getServerSession } from 'next-auth/next'
import { authOptions } from 'pages/api/auth/[...nextauth]'

export async function getSMJSession() {
  const session = await getServerSession(authOptions)
  if (!session) return null
  return session as ExtendedSession
}

export async function getSMJSessionAPI(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions)
  if (!session) return null
  return session as ExtendedSession
}

export function toClientSession(session: Session): UserSession {
  if (!session.user) return { workerId: '', name: '' }
  return {
    workerId: 'WorkerId here',
    name: session.user.email || '',
  }
}

export async function getClientSafeSession(): Promise<UserSession | null> {
  const session = await getSMJSession()
  if (!session) return null
  return toClientSession(session)
}

/**
 * Checks whether the current user has any of the given permissions, returns true if at least one is present.
 * If the user is an admin, they are always allowed. There's no need to specify admin permissions in the list.
 * Use this function in server-side pages.
 * @param permissions List of permissions to check for, if any of them are present, the user is allowed. If the user is an admin, they are always allowed.
 * @returns Success flag and the session if successful.
 */
export async function withPermissions(
  permissions: Permission[]
): Promise<{ success: true; session: ExtendedSession } | { success: false }> {
  const session = await getSMJSession()
  const allowed = isAccessAllowed(permissions, session)
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return allowed ? { success: true, session: session! } : { success: false }
}

/**
 * Checks whether the current user has any of the given permissions, returns true if at least one is present.
 * If the user is an admin, they are always allowed. There's no need to specify admin permissions in the list.
 * Use this function in API routes.
 * @param permissions List of permissions to check for, if any of them are present, the user is allowed. If the user is an admin, they are always allowed.
 * @returns Success flag and the session if successful.
 */
export async function withPermissionsAPI(
  permissions: Permission[],
  req: NextApiRequest,
  res: NextApiResponse
): Promise<{ success: true; session: ExtendedSession } | { success: false }> {
  const session = await getSMJSessionAPI(req, res)
  const allowed = isAccessAllowed(permissions, session)
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return allowed ? { success: true, session: session! } : { success: false }
}

export function isAccessAllowed(
  permissions: Permission[],
  session: ExtendedSession | null
): boolean {
  if (!session) return false
  if (permissions.length === 0) return true
  if (session.permissions.includes(Permission.ADMIN)) return true
  for (const permission of permissions) {
    if (session.permissions.includes(permission)) return true
  }
  return false
}

/**
 * Email HTML body
 * Insert invisible space into domains from being turned into a hyperlink by email
 * clients like Outlook and Apple mail, as this is confusing because it seems
 * like they are supposed to click on it to sign in.
 *
 * @note We don't add the email address to avoid needing to escape it, if you do, remember to sanitize it!
 */
export function emailHtml(params: { url: string; host: string }) {
  const { url } = params

  //const escapedHost = host.replace(/\./g, '&#8203;.')

  const brandColor = '#f9da68'
  const color = {
    background: '#f9f9f9',
    text: '#444',
    mainBackground: '#fff',
    buttonBackground: brandColor,
    buttonBorder: brandColor,
    buttonText: '#000',
  }

  return `
<body style="background: ${color.background};">
  <table width="100%" border="0" cellspacing="20" cellpadding="0"
    style="background: ${color.mainBackground}; max-width: 600px; margin: auto; border-radius: 10px;">
    <tr>
      <td align="center"
        style="padding: 10px 0px; font-size: 22px; font-family: Helvetica, Arial, sans-serif; color: ${color.text};">
        Přihlášení do aplikace <strong>SummerJob</strong>
      </td>
    </tr>
    <tr>
      <td align="center" style="padding: 20px 0;">
        <table border="0" cellspacing="0" cellpadding="0">
          <tr>
            <td align="center" style="border-radius: 5px;" bgcolor="${color.buttonBackground}"><a href="${url}"
                target="_blank"
                style="font-size: 18px; font-family: Helvetica, Arial, sans-serif; color: ${color.buttonText}; text-decoration: none; border-radius: 5px; padding: 10px 20px; border: 1px solid ${color.buttonBorder}; display: inline-block; ">Přihlásit se</a></td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td align="center"
        style="padding: 0px 0px 10px 0px; font-size: 16px; line-height: 22px; font-family: Helvetica, Arial, sans-serif; color: ${color.text};">
        Pokud jste si tento e-mail nevyžádali, můžete jej ignorovat.
      </td>
    </tr>
  </table>
</body>
`
}

/** Email Text body (fallback for email clients that don't render HTML, e.g. feature phones) */
export function emailText({ url }: { url: string; host: string }) {
  return `Přihlášení do aplikace SummerJob\n${url}\n\n`
}
