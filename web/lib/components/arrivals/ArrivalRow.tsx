'use client'
import { ArrivalWorker } from 'lib/types/arrival'
import {
  useAPIMarkArrived,
  useAPIMarkNoShow,
  useAPIUnmarkNoShow,
} from 'lib/fetcher/arrival'
import Link from 'next/link'
import { useState } from 'react'
import InlineCarForm from './InlineCarForm'
import ConfirmationModal from '../modal/ConfirmationModal'

interface ArrivalRowProps {
  worker: ArrivalWorker
  onUpdated: () => void
}

function formatBirthDate(isoDate: string | null): string {
  if (!isoDate) return ''
  const d = new Date(isoDate)
  const day = d.getDate().toString().padStart(2, '0')
  const month = (d.getMonth() + 1).toString().padStart(2, '0')
  const year = d.getFullYear()
  return `${day}.${month}.${year}`
}

export default function ArrivalRow({ worker, onUpdated }: ArrivalRowProps) {
  const [showCarForm, setShowCarForm] = useState(false)
  const [showHideConfirm, setShowHideConfirm] = useState(false)

  const { trigger: triggerArrived, isMutating: arriveMutating } =
    useAPIMarkArrived(worker.id, { onSuccess: onUpdated })

  const { trigger: triggerHide, isMutating: hideMutating } = useAPIMarkNoShow(
    worker.id,
    { onSuccess: onUpdated }
  )

  const { trigger: triggerUnhide, isMutating: unhideMutating } =
    useAPIUnmarkNoShow(worker.id, { onSuccess: onUpdated })

  const isMutating = arriveMutating || hideMutating || unhideMutating

  const handleArrived = () => {
    triggerArrived({})
  }

  const handleHide = () => {
    triggerHide({})
    setShowHideConfirm(false)
  }

  const handleUnhide = () => {
    triggerUnhide()
  }

  const rowClass = worker.arrived
    ? 'table-success'
    : !worker.show
      ? 'table-secondary text-muted'
      : ''

  return (
    <>
      <tr className={rowClass}>
        <td>
          <Link href={`/workers/${worker.id}`} className="smj-link">
            {worker.firstName} {worker.lastName}
          </Link>
        </td>
        <td>{worker.phone}</td>
        <td>{formatBirthDate(worker.birthDate)}</td>
        <td>
          {worker.cars.length > 0 ? (
            <span>{worker.cars.map(c => c.name).join(', ')}</span>
          ) : (
            <span className="text-muted">-</span>
          )}
          <button
            className="btn btn-sm btn-outline-secondary ms-2"
            type="button"
            onClick={() => setShowCarForm(!showCarForm)}
            title="Přidat auto"
          >
            <i className="fas fa-car"></i>
            <i className="fas fa-plus fa-xs ms-1"></i>
          </button>
        </td>
        <td className="smj-sticky-col-right smj-table-header">
          <div className="d-flex gap-1 justify-content-end">
            {!worker.arrived && worker.show && (
              <button
                className="btn btn-sm btn-success"
                type="button"
                onClick={handleArrived}
                disabled={isMutating}
                title="Označit jako dorazil"
              >
                <i className="fas fa-check"></i>
              </button>
            )}
            {worker.arrived && (
              <span className="badge bg-success align-self-center">
                <i className="fas fa-check me-1"></i>
                Dorazil
              </span>
            )}
            {worker.show && !worker.arrived && (
              <button
                className="btn btn-sm btn-outline-danger"
                type="button"
                onClick={() => setShowHideConfirm(true)}
                disabled={isMutating}
                title="Skrýt (nedorazil)"
              >
                <i className="fas fa-eye-slash"></i>
              </button>
            )}
            {!worker.show && (
              <button
                className="btn btn-sm btn-outline-secondary"
                type="button"
                onClick={handleUnhide}
                disabled={isMutating}
                title="Zrušit skrytí"
              >
                <i className="fas fa-eye"></i>
              </button>
            )}
          </div>
        </td>
      </tr>
      {showCarForm && (
        <tr>
          <td colSpan={5}>
            <InlineCarForm
              workerId={worker.id}
              onCreated={() => {
                setShowCarForm(false)
                onUpdated()
              }}
              onCancel={() => setShowCarForm(false)}
            />
          </td>
        </tr>
      )}
      {showHideConfirm && (
        <ConfirmationModal
          onConfirm={handleHide}
          onReject={() => setShowHideConfirm(false)}
        >
          <p>
            Opravdu chcete skrýt pracanta{' '}
            <strong>
              {worker.firstName} {worker.lastName}
            </strong>
            ? Bude skryt/a v celé aplikaci (plánování, seznamy pracantů, auta).
          </p>
        </ConfirmationModal>
      )}
    </>
  )
}
