import AdorationSlotsTable from 'lib/components/adoration/AdorationSlotsTable'
import { getActiveSummerJobEvent } from 'lib/data/summerjob-event'

export const dynamic = 'force-dynamic'

export default async function AdorationPageServer() {
  const event = await getActiveSummerJobEvent()

  if (!event) {
    return <p className="text-center mt-5 font-semibold">Žádný aktivní ročník</p>
  }

  const today = new Date().toISOString().slice(0, 10)
  const eventStart = event.startDate.toISOString().slice(0, 10)
  const eventEnd = event.endDate.toISOString().slice(0, 10)

  return (
    <div className="container mt-4">
      <h2>Adorace</h2>
      <AdorationSlotsTable initialDate={today} eventId={event.id} eventStart={eventStart} eventEnd={eventEnd} />
    </div>
  )
}
