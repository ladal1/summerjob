import AdorationSlotsTable from 'lib/components/adoration/AdorationSlotsTable'
import { getActiveSummerJobEvent } from 'lib/data/summerjob-event'

export const dynamic = 'force-dynamic'

export default async function AdorationPageServer() {
  const event = await getActiveSummerJobEvent()

  if (!event) {
    return (
      <p className="text-center mt-5 font-semibold">Žádný aktivní ročník</p>
    )
  }

  return (
    <div className="container mt-4">
      <div className="row align-items-center mb-4">
        <div className="col-auto">
          <div
            className="bg-primary rounded-circle d-flex align-items-center justify-content-center me-3"
            style={{ width: '60px', height: '60px' }}
          >
            <i className="fas fa-church fa-2x text-white"></i>
          </div>
        </div>
        <div className="col">
          <h2 className="mb-0">Adorace</h2>
          <p className="text-muted mb-0">Přihlašte se na adorační časy</p>
        </div>
      </div>
      <AdorationSlotsTable eventId={event.id} />
    </div>
  )
}
