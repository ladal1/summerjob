import { getSMJSession, withPermissions } from 'lib/auth/auth'
import ErrorPage404 from 'lib/components/404/404'
import dateSelectionMaker from 'lib/components/forms/dateSelectionMaker'
import EditWorker from 'lib/components/worker/EditWorker'
import { cache_getActiveSummerJobEvent } from 'lib/data/cache'
import { getUserOAuthLinks } from 'lib/data/users'
import { getWorkerById } from 'lib/data/workers'
import { Permission } from 'lib/types/auth'
import { serializeWorker } from 'lib/types/worker'

export const metadata = {
  title: 'Můj profil',
}

export const dynamic = 'force-dynamic'

export default async function MyProfilePage() {
  const session = await getSMJSession()

  const worker = await getWorkerById(session!.userID)

  if (!worker || !worker.availability) {
    return <ErrorPage404 message="Pracant nenalezen." />
  }
  const serializedWorker = serializeWorker(worker)
  const summerJobEvent = await cache_getActiveSummerJobEvent()

  const { startDate, endDate } = summerJobEvent!

  const allDates = dateSelectionMaker(startDate.toJSON(), endDate.toJSON())

  const isCarAccessAllowed = await withPermissions([Permission.CARS])

  const nextAuthUser = await getUserOAuthLinks(worker.email)
  const providers = new Set(nextAuthUser?.accounts.map(a => a.provider) ?? [])
  const oauthLinks = {
    google: providers.has('google'),
    seznam: providers.has('seznam'),
  }

  return (
    <>
      <EditWorker
        serializedWorker={serializedWorker}
        allDates={allDates}
        isProfilePage={true}
        carAccess={isCarAccessAllowed.success}
        label="Upravit profil"
        oauthLinks={oauthLinks}
      />
    </>
  )
}
