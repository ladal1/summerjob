import { AreaComplete } from 'lib/types/area'
import Link from 'next/link'
import { AreaRow } from './AreaRow'

interface AreaListProps {
  areas: AreaComplete[]
  eventId: string
  onDataChanged: () => void
}

export default function AreaList({
  areas,
  eventId,
  onDataChanged,
}: AreaListProps) {
  return (
    <>
      <div className="d-flex justify-content-between align-items-center">
        <h4 className="mb-3">Oblasti</h4>
        <Link href={`/admin/events/${eventId}/areas/new`}>
          <button className="btn btn-light pt-2 pb-2 align-self-start">
            <i className="fas fa-plus me-2"></i>
            Přidat oblast
          </button>
        </Link>
      </div>
      <ul className="list-group mt-3">
        {areas.length === 0 && (
          <>
            <li className="list-group-item">
              <div className="d-flex justify-content-center text-muted">
                Žádné oblasti
              </div>
            </li>
          </>
        )}
        {areas.map(area => (
          <AreaRow
            key={area.id}
            area={area}
            eventId={eventId}
            onDataChanged={onDataChanged}
          />
        ))}
      </ul>
    </>
  )
}
