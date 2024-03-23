import LogsClientPage from 'lib/components/logs/LogsClientPage'
import PageHeader from 'lib/components/page-header/PageHeader'
import { getLogs } from 'lib/data/logs'
import { serializeLogs } from 'lib/types/logger'

export const dynamic = 'force-dynamic'

export default async function LogsPage() {
  const logs = await getLogs({})
  const sLogs = serializeLogs(logs)
  return (
    <>
      <PageHeader title={'Logy'} />
      <LogsClientPage sLogs={sLogs} />
    </>
  )
}
