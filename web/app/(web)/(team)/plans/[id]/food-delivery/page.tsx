import ErrorPage404 from 'lib/components/404/404'
import FoodDeliveryClientPage from 'lib/components/plan/FoodDeliveryClientPage'
import { getPlanById } from 'lib/data/plans'
import { serializePlan } from 'lib/types/plan'

type PathProps = {
  params: Promise<{
    id: string
  }>
}

export default async function FoodDeliveryPage(props: PathProps) {
  const params = await props.params;
  const plan = await getPlanById(params.id)
  if (!plan) return <ErrorPage404 message="Plán nenalezen." />
  const serialized = serializePlan(plan)

  return (
    <FoodDeliveryClientPage
      planId={params.id}
      initialDataPlan={serialized}
    />
  )
}
