import { useAPIWorkerDelete } from 'lib/fetcher/worker'
import { WorkerComplete } from 'lib/types/worker'
import Link from 'next/link'
import DeleteIcon from '../forms/DeleteIcon'
import ErrorMessageModal from '../modal/ErrorMessageModal'
import { SimpleRow } from '../table/SimpleRow'

interface WorkerRowProps {
  worker: WorkerComplete
  onUpdated: () => void
  onHover: (url: string | null) => void
}

export default function WorkerRow({
  worker,
  onUpdated,
  onHover,
}: WorkerRowProps) {
  const { trigger, isMutating, error, reset } = useAPIWorkerDelete(worker.id, {
    onSuccess: onUpdated,
  })
  return (
    <SimpleRow
      key={worker.id}
      data={formatWorkerRow(worker, trigger, isMutating, error, reset)}
      onMouseEnter={() =>
        worker.photoPath
          ? onHover(`/api/workers/${worker.id}/photo`)
          : onHover(null)
      }
      onMouseLeave={() => onHover(null)}
    />
  )
}

function formatWorkerRow(
  worker: WorkerComplete,
  onRequestDelete: () => void,
  isBeingDeleted: boolean,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    { content: worker.firstName },
    { content: worker.lastName },
    { content: worker.phone },
    { content: worker.email },
    {
      content: (
        <>
          {worker.cars.length > 0 && (
            <i className="fas fa-car me-2" title={'Má auto'} />
          )}
          {worker.isStrong && (
            <i className="fas fa-dumbbell me-2" title={'Silák'} />
          )}
          {worker.isTeam && (
            <i className="fa-solid fa-people-group" title={'Tým'} />
          )}
        </>
      ),
    },
    {
      content: (
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
        </span>
      ),
      stickyRight: true,
    },
  ]
}
