import ErrorPage404 from 'lib/components/404/404'
import PlanClientPage from 'lib/components/plan/PlanClientPage'
import { getPlanById } from 'lib/data/plans'
import { getWorkers } from 'lib/data/workers'
import { serializePlan } from 'lib/types/plan'
import { serializeWorkers } from 'lib/types/worker'

type PathProps = {
  params: {
    id: string
  }
}

export default async function PlanPage({ params }: PathProps) {
  const plan = await getPlanById(params.id)
  if (!plan) return <ErrorPage404 message="Plán nenalezen." />
  const serialized = serializePlan(plan)
  const jobless = await getWorkers(plan.id)
  const joblessSerialized = serializeWorkers(jobless)

  return (
    <PlanClientPage
      id={params.id}
      initialDataPlan={serialized}
      initialDataJoblessWorkers={joblessSerialized}
    />
  )
}
