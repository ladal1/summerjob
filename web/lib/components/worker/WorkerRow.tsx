import { useAPIWorkerDelete } from 'lib/fetcher/worker'
import { WorkerComplete } from 'lib/types/worker'
import Link from 'next/link'
import DeleteIcon from '../forms/DeleteIcon'
import ErrorMessageModal from '../modal/ErrorMessageModal'
import { SimpleRow } from '../table/SimpleRow'

interface WorkerRowProps {
  worker: WorkerComplete
  onUpdated: () => void
}

export default function WorkerRow({ worker, onUpdated }: WorkerRowProps) {
  const { trigger, isMutating, error, reset } = useAPIWorkerDelete(worker.id, {
    onSuccess: onUpdated,
  })
  return (
    <SimpleRow
      key={worker.id}
      data={formatWorkerRow(worker, trigger, isMutating, error, reset)}
    />
  )
}

function formatWorkerRow(
  worker: WorkerComplete,
  onRequestDelete: () => void,
  isBeingDeleted: boolean,
  deletingError: any,
  resetError: () => void
) {
  const confirmationText = () => {
    return (
      <>
        <div>
          Opravdu chcete smazat pracanta {worker.firstName} {worker.lastName}?
        </div>
        Dojde také k odstranění přidružených aut.
      </>
    )
  }
  return [
    worker.firstName,
    worker.lastName,
    worker.phone,
    worker.email,
    <>
      {worker.cars.length > 0 && (
        <i className="fas fa-car me-2" title={'Má auto'} />
      )}
      {worker.isStrong && <i className="fas fa-dumbbell" title={'Silák'} />}
    </>,
    <span
      key={`actions-${worker.id}`}
      className="d-flex align-items-center gap-3"
    >
      <Link
        href={`/workers/${worker.id}`}
        onClick={e => e.stopPropagation()}
        className="smj-action-edit"
      >
        <i className="fas fa-edit" title="Upravit"></i>
      </Link>
      <DeleteIcon
        onClick={onRequestDelete}
        isBeingDeleted={isBeingDeleted}
        showConfirmation={true}
        getConfirmationMessage={confirmationText}
      />
      {deletingError && (
        <ErrorMessageModal
          onClose={resetError}
          mainMessage={'Nepodařilo se odstranit pracanta.'}
        />
      )}
    </span>,
  ]
}
