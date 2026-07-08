import { useAPIWorkerDelete, useAPIWorkerUpdate } from 'lib/fetcher/worker'
import { WorkerComplete } from 'lib/types/worker'
import Link from 'next/link'
import DeleteIcon from '../table/icons/DeleteIcon'
import ErrorMessageModal from '../modal/ErrorMessageModal'
import { SimpleRow } from '../table/SimpleRow'
import { ColorTagCell } from '../table/ColorTagCell'
import { ColorTag } from 'lib/prisma/client'
import { PhoneLink } from 'lib/components/phone/PhoneText'

interface WorkerRowProps {
  worker: WorkerComplete
  onUpdated: () => void
  onHover: (url: string | null) => void
  accessedFromReception: boolean
}

export default function WorkerRow({
  worker,
  onUpdated,
  onHover,
  accessedFromReception,
}: WorkerRowProps) {
  const { trigger, isMutating, error, reset } = useAPIWorkerDelete(worker.id, {
    onSuccess: onUpdated,
  })
  const { trigger: triggerUpdate } = useAPIWorkerUpdate(worker.id, {
    onSuccess: onUpdated,
  })
  const setColorTags = (colorTags: ColorTag[]) => {
    triggerUpdate({ colorTags })
  }
  return (
    <SimpleRow
      key={worker.id}
      data={formatWorkerRow(
        worker,
        trigger,
        isMutating,
        error,
        reset,
        accessedFromReception,
        setColorTags
      )}
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
  resetError: () => void,
  accessedFromReception: boolean,
  setColorTags: (colorTags: ColorTag[]) => void
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
    {
      content: (
        <span className="d-inline-flex align-items-center">
          {!accessedFromReception && (
            <ColorTagCell tags={worker.colorTags} onChange={setColorTags} />
          )}
          {worker.firstName}
        </span>
      ),
    },
    { content: worker.lastName },
    {
      content: (
        <PhoneLink phone={worker.phone} className="text-decoration-none" />
      ),
    },
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
          {!accessedFromReception && (
            <DeleteIcon
              onClick={onRequestDelete}
              isBeingDeleted={isBeingDeleted}
              showConfirmation={true}
              getConfirmationMessage={confirmationText}
            />
          )}
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
