import { withPermissions } from 'lib/auth/auth'
import ErrorPage404 from 'lib/components/404/404'
import dateSelectionMaker from 'lib/components/forms/dateSelectionMaker'
import EditWorker from 'lib/components/worker/EditWorker'
import { cache_getActiveSummerJobEvent } from 'lib/data/cache'
import { getWorkerById } from 'lib/data/workers'
import { Permission } from 'lib/types/auth'
import { serializeWorker } from 'lib/types/worker'

type Params = {
  params: Promise<{
    id: string
  }>
}

export default async function EditWorkerPage(props: Params) {
  const params = await props.params;
  const worker = await getWorkerById(params.id)
  if (!worker) {
    return <ErrorPage404 message="Pracant nenalezen." />
  }
  const serializedWorker = serializeWorker(worker)
  const summerJobEvent = await cache_getActiveSummerJobEvent()
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const { startDate, endDate } = summerJobEvent!

  const allDates = dateSelectionMaker(startDate.toJSON(), endDate.toJSON())

  const isCarAccessAllowed = await withPermissions([Permission.CARS])

  return (
    <>
      <EditWorker
        serializedWorker={serializedWorker}
        allDates={allDates}
        isProfilePage={false}
        carAccess={isCarAccessAllowed.success}
        label="Upravit pracanta"
      />
    </>
  )
}
