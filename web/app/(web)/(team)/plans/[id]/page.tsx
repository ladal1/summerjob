import { getSMJSession } from 'lib/auth/auth'
import ErrorPage404 from 'lib/components/404/404'
import PlanClientPage from 'lib/components/plan/PlanClientPage'
import { getPlanById } from 'lib/data/plans'
import { getWorkers } from 'lib/data/workers'
import { Permission } from 'lib/types/auth'
import { serializePlan } from 'lib/types/plan'
import { serializeWorkers } from 'lib/types/worker'

type PathProps = {
  params: Promise<{
    id: string
  }>
}

export default async function PlanPage(props: PathProps) {
  const params = await props.params
  const session = await getSMJSession()
  const accessedFromReception = !!session?.permissions.includes(
    Permission.RECEPTION
  )
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
      accessedFromReception={accessedFromReception}
      workerId={session!.userID}
    />
  )
}
