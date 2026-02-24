import { getSMJSession } from 'lib/auth/auth'
import WorkersClientPage from 'lib/components/worker/WorkersClientPage'
import { getWorkers } from 'lib/data/workers'
import { Permission } from 'lib/types/auth'
import { serializeWorkers } from 'lib/types/worker'

export const dynamic = 'force-dynamic'

export default async function WorkersPage() {
  const workers = await getWorkers()
  const sWorkers = serializeWorkers(workers)

  const session = await getSMJSession()
  const accessedFromReception = !!session?.permissions.includes(
    Permission.RECEPTION
  )

  return (
    <WorkersClientPage
      sWorkers={sWorkers}
      accessedFromReception={accessedFromReception}
    />
  )
}
