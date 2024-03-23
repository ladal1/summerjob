import EditBox from 'lib/components/forms/EditBox'
import CreateWorker from 'lib/components/worker/CreateWorker'
import { cache_getActiveSummerJobEvent } from 'lib/data/cache'

export const dynamic = 'force-dynamic'

export default async function CreateWorkerPage() {
  const summerJobEvent = await cache_getActiveSummerJobEvent()
  const { startDate, endDate } = summerJobEvent!

  return (
    <>
      <section className="mb-3">
        <EditBox>
          <CreateWorker
            eventStartDate={startDate.toJSON()}
            eventEndDate={endDate.toJSON()}
          />
        </EditBox>
      </section>
    </>
  )
}
