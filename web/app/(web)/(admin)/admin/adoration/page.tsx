import { getActiveSummerJobEvent } from 'lib/data/summerjob-event'
import AdminAdorationManager from 'lib/components/adoration/AdorationAdminPage'

export const dynamic = 'force-dynamic'

export default async function AdminAdorationPage() {
  const event = await getActiveSummerJobEvent()

  if (!event) {
    return <p className="mt-5 text-center">Žádný aktivní ročník</p>
  }

  return (
    <div className="container mt-4">
      <AdminAdorationManager
        event={{
          id: event.id,
          startDate: event.startDate.toISOString(),
          endDate: event.endDate.toISOString()
        }}
      />
    </div>
  )
}
