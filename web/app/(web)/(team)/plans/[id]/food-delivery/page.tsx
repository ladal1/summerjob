import { getSMJSession } from 'lib/auth/auth'
import ErrorPage404 from 'lib/components/404/404'
import AccessDeniedPage from 'lib/components/error-page/AccessDeniedPage'
import FoodDeliveryPage from 'lib/components/plan/food-delivery/FoodDeliveryPage'
import { getPlanById } from 'lib/data/plans'
import { Permission } from 'lib/types/auth'
import { serializePlan } from 'lib/types/plan'

type PathProps = {
  params: Promise<{
    id: string
  }>
}

export default async function Page(props: PathProps) {
  const params = await props.params
  const plan = await getPlanById(params.id)
  if (!plan) return <ErrorPage404 message="Plán nenalezen." />
  const serialized = serializePlan(plan)

  const session = await getSMJSession()
  const accessedFromReception = session?.permissions.includes(
    Permission.RECEPTION
  )
  if (accessedFromReception) {
    return <AccessDeniedPage />
  }

  return <FoodDeliveryPage planId={params.id} initialDataPlan={serialized} />
}
