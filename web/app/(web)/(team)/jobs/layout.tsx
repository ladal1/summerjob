import { withPermissions } from 'lib/auth/auth'
import AccessDeniedPage from 'lib/components/error-page/AccessDeniedPage'
import { Permission } from 'lib/types/auth'

export const metadata = {
  title: 'Joby',
}

export default async function JobsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const isAllowed = await withPermissions([Permission.JOBS])
  if (!isAllowed.success) {
    return <AccessDeniedPage />
  }
  return <>{children}</>
}
