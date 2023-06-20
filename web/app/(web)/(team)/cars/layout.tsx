import { withPermissions } from 'lib/auth/auth'
import AccessDeniedPage from 'lib/components/error-page/AccessDeniedPage'
import { Permission } from 'lib/types/auth'

export const metadata = {
  title: 'Auta',
}

export default async function CarsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const isAllowed = await withPermissions([Permission.CARS])
  if (!isAllowed.success) {
    return <AccessDeniedPage />
  }
  return <>{children}</>
}
