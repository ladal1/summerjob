import { getActiveSummerJobEvent } from 'lib/data/summerjob-event'
import { getSMJSession } from 'lib/auth/auth'
import { Permission } from 'lib/types/auth'
import AdminAdorationManager from 'lib/components/adoration/AdorationAdminPage'

export const dynamic = 'force-dynamic'

export default async function AdminAdorationPage() {
  const event = await getActiveSummerJobEvent()
  const session = await getSMJSession()

  if (!event) {
    return <p className="mt-5 text-center">Žádný aktivní ročník</p>
  }

  const canDeleteSlots = session?.permissions.includes(Permission.ADMIN) ?? false

  return (
    <div className="container mt-4">
      <AdminAdorationManager
        event={{
          id: event.id,
          startDate: event.startDate.toISOString(),
          endDate: event.endDate.toISOString()
        }}
        canDeleteSlots={canDeleteSlots}
      />
    </div>
  )
}
