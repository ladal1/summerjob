import { withPermissions } from 'lib/auth/auth'
import AccessDeniedPage from 'lib/components/error-page/AccessDeniedPage'
import { Permission } from 'lib/types/auth'

export default async function PrintPlanLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const isAllowed = await withPermissions([Permission.PLANS])
  if (!isAllowed.success) {
    return <AccessDeniedPage />
  }
  return <>{children}</>
}
