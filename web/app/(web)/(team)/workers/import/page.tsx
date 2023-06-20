import ImportWorkersClientPage from 'lib/components/worker/ImportWorkersClientPage'
import { cache_getActiveSummerJobEvent } from 'lib/data/cache'

export const dynamic = 'force-dynamic'

export default async function ImportWorkersPage() {
  const summerJobEvent = await cache_getActiveSummerJobEvent()
  const { startDate, endDate } = summerJobEvent!
  return (
    <ImportWorkersClientPage
      eventName={summerJobEvent!.name}
      eventStartDate={startDate.toJSON()}
      eventEndDate={endDate.toJSON()}
    />
  )
}
