import { getSMJSession } from 'lib/auth/auth'
import PlansClientPage from 'lib/components/plan/PlansClientPage'
import { cache_getActiveSummerJobEvent } from 'lib/data/cache'
import { getPlans } from 'lib/data/plans'
import { Permission } from 'lib/types/auth'
import { serializePlans } from 'lib/types/plan'

export const dynamic = 'force-dynamic'

export default async function PlansPage() {
  const plans = await getPlans()
  const serialized = serializePlans(plans)
  const summerJobEvent = await cache_getActiveSummerJobEvent()

  const session = await getSMJSession()
  const accessedFromReception = !!session?.permissions.includes(
    Permission.RECEPTION
  )

  const { startDate, endDate } = summerJobEvent!
  return (
    <PlansClientPage
      initialData={serialized}
      startDate={startDate.toJSON()}
      endDate={endDate.toJSON()}
      accessedFromReception={accessedFromReception}
    />
  )
}
