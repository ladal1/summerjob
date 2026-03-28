import { getSMJSession } from 'lib/auth/auth'
import AccessDeniedPage from 'lib/components/error-page/AccessDeniedPage'
import FoodDeliveryClientPage from 'lib/components/plan/FoodDeliveryClientPage'
import { Permission } from 'lib/types/auth'

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export default async function Page(props: PageProps) {
  const params = await props.params
  const { id } = params

  const session = await getSMJSession()
  const accessedFromReception = session?.permissions.includes(
    Permission.RECEPTION
  )
  if (accessedFromReception) {
    return <AccessDeniedPage />
  }

  return <FoodDeliveryClientPage planId={id} />
}
