import { withPermissions } from 'lib/auth/auth'
import ArrivalsClientPage from 'lib/components/arrivals/ArrivalsClientPage'
import ArrivalsExportButton from 'lib/components/arrivals/ArrivalsExportButton'
import ErrorPage404 from 'lib/components/404/404'
import PageHeader from 'lib/components/page-header/PageHeader'
import { Permission } from 'lib/types/auth'
import { getArrivalsWorkers } from 'lib/data/arrivals'
import { serializeArrivals } from 'lib/types/arrival'

export const dynamic = 'force-dynamic'

export default async function ArrivalsPage() {
  const isAllowed = await withPermissions([
    Permission.WORKERS,
    Permission.ADMIN,
    Permission.RECEPTION,
  ])
  if (!isAllowed.success) {
    return <ErrorPage404 message="Stránka nenalezena." />
  }

  const workers = await getArrivalsWorkers()
  const sWorkers = serializeArrivals(workers)

  return (
    <>
      <PageHeader title="Příjezdy" isFluid={false}>
        <ArrivalsExportButton />
      </PageHeader>
      <ArrivalsClientPage sWorkers={sWorkers} />
    </>
  )
}
