import { format } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'
import { AdorationSlotWithWorkerIds } from 'lib/types/adoration'

interface AdorationSlotTableProps {
  label: string
  slots: AdorationSlotWithWorkerIds[]
}

export default async function AdorationSlotTable({
  label,
  slots,
}: AdorationSlotTableProps) {
  return (
    <div>
      <h4 className="fs-3 mb-2">
        <i className="fas fa-calendar me-1"></i>
        {label}
      </h4>
      <table className="table table-striped align-middle mb-4">
        <thead className="table-primary">
          <tr>
            <th scope="col w-25">Čas</th>
            <th scope="col w-50">Místo</th>
            <th scope="col">Zaplněnost</th>
          </tr>
        </thead>
        <tbody>
          {slots.map(slot => {
            const dateEnd = new Date(
              slot.dateStart.getTime() + slot.length * 60 * 1000
            )
            const localStartTime = toZonedTime(slot.dateStart, 'Europe/Prague')
            const localEndTime = toZonedTime(dateEnd, 'Europe/Prague')

            const startTimeStr = format(localStartTime, 'HH:mm')
            const endTimeStr = format(localEndTime, 'HH:mm')
            return (
              <tr key={slot.id}>
                <td className="w-25 text-nowrap">
                  {startTimeStr} - {endTimeStr}
                </td>
                <td className="w-50">{slot.location}</td>
                <td>
                  {slot.workers.length} / {slot.capacity}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
