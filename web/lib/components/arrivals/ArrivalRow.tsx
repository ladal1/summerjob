'use client'
import { ArrivalWorker } from 'lib/types/arrival'
import {
  useAPIMarkArrived,
  useAPIUnmarkArrived,
  useAPIMarkNoShow,
  useAPIUnmarkNoShow,
} from 'lib/fetcher/arrival'
import Link from 'next/link'
import { useState } from 'react'
import InlineCarForm from './InlineCarForm'
import ConfirmationModal from '../modal/ConfirmationModal'
import ErrorMessageModal from '../modal/ErrorMessageModal'

interface ArrivalRowProps {
  worker: ArrivalWorker
  onUpdated: () => void
  onWorkerArrived: (workerId: string) => void
  onWorkerHidden: (workerId: string) => void
}

function formatBirthDate(isoDate: string | null): string {
  if (!isoDate) return ''
  const d = new Date(isoDate)
  const day = d.getDate().toString().padStart(2, '0')
  const month = (d.getMonth() + 1).toString().padStart(2, '0')
  const year = d.getFullYear()
  return `${day}.${month}.${year}`
}

export default function ArrivalRow({
  worker,
  onUpdated,
  onWorkerArrived,
  onWorkerHidden,
}: ArrivalRowProps) {
  const [showCarForm, setShowCarForm] = useState(false)
  const [showHideConfirm, setShowHideConfirm] = useState(false)
  const [optimisticArrived, setOptimisticArrived] = useState<boolean | null>(
    null
  )
  const [optimisticShow, setOptimisticShow] = useState<boolean | null>(null)
  const [error, setError] = useState(false)

  const arrived = optimisticArrived ?? worker.arrived
  const show = optimisticShow ?? worker.show

  const { trigger: triggerArrived, isMutating: arriveMutating } =
    useAPIMarkArrived(worker.id, {
      onSuccess: () => {
        setOptimisticArrived(null)
        onUpdated()
      },
      onError: () => {
        setOptimisticArrived(null)
        setError(true)
      },
    })

  const { trigger: triggerHide, isMutating: hideMutating } = useAPIMarkNoShow(
    worker.id,
    {
      onSuccess: () => {
        setOptimisticShow(null)
        onUpdated()
      },
      onError: () => {
        setOptimisticShow(null)
        setError(true)
      },
    }
  )

  const { trigger: triggerUnarrive, isMutating: unarriveMutating } =
    useAPIUnmarkArrived(worker.id, {
      onSuccess: () => {
        setOptimisticArrived(null)
        onUpdated()
      },
      onError: () => {
        setOptimisticArrived(null)
        setError(true)
      },
    })

  const { trigger: triggerUnhide, isMutating: unhideMutating } =
    useAPIUnmarkNoShow(worker.id, {
      onSuccess: () => {
        setOptimisticShow(null)
        onUpdated()
      },
      onError: () => {
        setOptimisticShow(null)
        setError(true)
      },
    })

  const arriveBusy = arriveMutating || unarriveMutating
  const hideBusy = hideMutating || unhideMutating

  const handleArrived = () => {
    setOptimisticArrived(true)
    triggerArrived({})
    onWorkerArrived(worker.id)
  }

  const handleHide = () => {
    setOptimisticShow(false)
    triggerHide({})
    setShowHideConfirm(false)
    onWorkerHidden(worker.id)
  }

  const handleUnarrive = () => {
    setOptimisticArrived(false)
    triggerUnarrive()
  }

  const handleUnhide = () => {
    setOptimisticShow(true)
    triggerUnhide()
  }

  const rowClass = !show ? 'smj-table-body text-muted' : 'smj-table-body'

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
          {worker.cars.length > 0 && (
            <span>{worker.cars.map(c => c.name).join(', ')}</span>
          )}
          <span
            className="smj-action-edit cursor-pointer ms-2"
            role="button"
            onClick={() => setShowCarForm(!showCarForm)}
            title="Přidat auto"
          >
            <i className="fas fa-car"></i>
            <i className="fas fa-plus fa-xs ms-1"></i>
          </span>
        </td>
        <td className="smj-sticky-col-right smj-table-body">
          <div className="d-flex align-items-center gap-3 justify-content-end">
            {arriveBusy ? (
              <i
                className="fas fa-spinner smj-action-complete spinning"
                title="Ukládám..."
              ></i>
            ) : !arrived && show ? (
              <i
                className="fas fa-check smj-action-complete cursor-pointer"
                title="Označit jako dorazil"
                onClick={handleArrived}
              ></i>
            ) : arrived ? (
              <i
                className="fas fa-times smj-action-completed cursor-pointer"
                title="Zrušit příchod"
                onClick={handleUnarrive}
              ></i>
            ) : (
              <></>
            )}
            {hideBusy ? (
              <i
                className="fas fa-spinner smj-action-hide spinning"
                title="Ukládám..."
              ></i>
            ) : show && !arrived ? (
              <i
                className="fas fa-eye-slash smj-action-hide cursor-pointer"
                title="Skrýt (nedorazil)"
                onClick={() => setShowHideConfirm(true)}
              ></i>
            ) : !show ? (
              <i
                className="fas fa-eye smj-action-hidden cursor-pointer"
                title="Zrušit skrytí"
                onClick={handleUnhide}
              ></i>
            ) : (
              <></>
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
      {error && (
        <ErrorMessageModal
          onClose={() => setError(false)}
          mainMessage={'Akci se nepodařilo provést. Zkuste to znovu.'}
        />
      )}
    </>
  )
}
