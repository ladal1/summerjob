import { withPermissions } from 'lib/auth/auth'
import AccessDeniedPage from 'lib/components/error-page/AccessDeniedPage'
import { Permission } from 'lib/types/auth'

export default async function PrintWorkersLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const isAllowed = await withPermissions([Permission.WORKERS])
  if (!isAllowed.success) {
    return <AccessDeniedPage />
  }
  return <>{children}</>
}
