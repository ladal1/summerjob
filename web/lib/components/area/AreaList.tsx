import { useAPIAreaDelete } from 'lib/fetcher/area'
import { AreaComplete } from 'lib/types/area'
import Link from 'next/link'
import { useState } from 'react'
import DeleteIcon from '../forms/DeleteIcon'
import ConfirmationModal from '../modal/ConfirmationModal'
import ErrorMessageModal from '../modal/ErrorMessageModal'

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

interface AreaRowProps {
  area: AreaComplete
  eventId: string
  onDataChanged: () => void
}

function AreaRow({ area, eventId, onDataChanged }: AreaRowProps) {
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)
  const { trigger, isMutating, error, reset } = useAPIAreaDelete(area, {
    onSuccess: onDataChanged,
  })

  const triggerDelete = () => {
    trigger()
    setShowDeleteConfirmation(false)
  }

  const confirmDelete = () => {
    setShowDeleteConfirmation(true)
  }

  const onErrorMessageClose = () => {
    reset()
  }
  return (
    <li className="list-group-item list-group-item-action">
      <div className="d-flex justify-content-between align-items-center">
        <div className="d-flex flex-column pe-5">
          <label className="fs-5">{area.name}</label>
          <div className="text-muted">
            Doprava nutná: {area.requiresCar ? 'Ano' : 'Ne'}
          </div>
          <div className="text-muted mb-2">
            Adorace: {area.supportsAdoration ? 'Ano' : 'Ne'}
          </div>
        </div>
        <div className="d-flex align-items-center gap-3">
          <Link
            href={`/admin/events/${eventId}/areas/${area.id}`}
            className="smj-action-edit"
          >
            <i className="fas fa-edit me-2"></i>
          </Link>
          <DeleteIcon onClick={confirmDelete} isBeingDeleted={isMutating} />
        </div>
      </div>
      {showDeleteConfirmation && !error && (
        <ConfirmationModal
          onConfirm={triggerDelete}
          onReject={() => setShowDeleteConfirmation(false)}
        >
          <p>
            Opravdu chcete smazat oblast <b>{area.name}</b>?
          </p>
          {area.jobs.length > 0 && (
            <div className="alert alert-danger">
              V této oblasti jsou existující joby!
              <br /> Odstraněním zároveň odstraníte všechny související položky.
            </div>
          )}
        </ConfirmationModal>
      )}
      {error && (
        <ErrorMessageModal
          onClose={onErrorMessageClose}
          mainMessage={'Nepovedlo se odstranit oblast.'}
        />
      )}
    </li>
  )
}
