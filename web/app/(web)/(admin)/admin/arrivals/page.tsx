import { withPermissions } from 'lib/auth/auth'
import ArrivalsClientPage from 'lib/components/arrivals/ArrivalsClientPage'
import ErrorPage404 from 'lib/components/404/404'
import PageHeader from 'lib/components/page-header/PageHeader'
import { Permission } from 'lib/types/auth'
import { getArrivalsWorkers } from 'lib/data/arrivals'
import { serializeArrivals } from 'lib/types/arrival'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function ArrivalsPage() {
  const isAllowed = await withPermissions([
    Permission.WORKERS,
    Permission.ADMIN,
  ])
  if (!isAllowed.success) {
    return <ErrorPage404 message="Stránka nenalezena." />
  }

  const workers = await getArrivalsWorkers()
  const sWorkers = serializeArrivals(workers)

  return (
    <>
      <PageHeader title="Příjezdy" isFluid={false}>
        <Link
          href="/api/arrivals/export-csv"
          className="btn btn-secondary btn-with-icon"
        >
          <i className="fas fa-file-csv"></i>
          <span>Export CSV</span>
        </Link>
      </PageHeader>
      <ArrivalsClientPage sWorkers={sWorkers} />
    </>
  )
}
