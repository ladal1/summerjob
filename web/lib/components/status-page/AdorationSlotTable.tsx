import { format } from 'date-fns'
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
    <div className="mb-5 w-75">
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
            const endTime = new Date(
              slot.dateStart.getTime() + slot.length * 60000
            )
            const startTimeStr = format(slot.dateStart, 'HH:mm')
            const endTimeStr = format(endTime, 'HH:mm')
            return (
              <tr key={slot.id}>
                <td className="w-25">
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
