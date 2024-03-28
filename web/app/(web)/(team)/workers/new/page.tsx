import { withPermissions } from 'lib/auth/auth'
import dateSelectionMaker from 'lib/components/forms/dateSelectionMaker'
import CreateWorker from 'lib/components/worker/CreateWorker'
import { cache_getActiveSummerJobEvent } from 'lib/data/cache'
import { Permission } from 'lib/types/auth'

export const dynamic = 'force-dynamic'

export default async function CreateWorkerPage() {
  const summerJobEvent = await cache_getActiveSummerJobEvent()
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const { startDate, endDate } = summerJobEvent!

  const allDates = dateSelectionMaker(startDate.toJSON(), endDate.toJSON())

  const isCarAccessAllowed = await withPermissions([Permission.CARS])

  return (
    <>
      <CreateWorker
        allDates={allDates}
        carAccess={isCarAccessAllowed.success}
      />
    </>
  )
}
