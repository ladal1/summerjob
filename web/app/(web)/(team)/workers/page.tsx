import WorkersClientPage from 'lib/components/worker/WorkersClientPage'
import { getWorkers } from 'lib/data/workers'
import { serializeWorkers } from 'lib/types/worker'

export const dynamic = 'force-dynamic'

export default async function WorkersPage() {
  const workers = await getWorkers()
  const sWorkers = serializeWorkers(workers)

  return <WorkersClientPage sWorkers={sWorkers} />
}
