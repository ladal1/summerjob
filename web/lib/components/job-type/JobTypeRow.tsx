import Link from 'next/link'
import { JobTypeComplete } from 'lib/types/job-type'
import { useAPIJobTypeDelete } from 'lib/fetcher/job-type'
import DeleteIcon from '../table/icons/DeleteIcon'
import ErrorMessageModal from '../modal/ErrorMessageModal'
import { DndSortableRow } from '../table/DndSortableRow'

interface JobTypeRowProps {
  jobType: JobTypeComplete
  onUpdated: () => void
}

export default function JobTypeRow({ jobType, onUpdated }: JobTypeRowProps) {
  const { trigger, isMutating, error, reset } = useAPIJobTypeDelete(
    jobType.id,
    { onSuccess: onUpdated }
  )

  const confirmationText = () => (
    <>
      <div>Opravdu chcete smazat typ práce „{jobType.name}“?</div>
      Pokud je přiřazen jobům nebo nástrojům, bude z nich odstraněn.
    </>
  )

  return (
    <DndSortableRow
      id={jobType.id}
      data={[
        { content: jobType.name },
        {
          content: (
            <span
              key={`actions-${jobType.id}`}
              className="d-flex align-items-center gap-3"
            >
              <Link
                href={`/admin/lists/job-types/${jobType.id}`}
                onClick={e => e.stopPropagation()}
                className="smj-action-edit"
              >
                <i className="fas fa-edit" title="Upravit"></i>
              </Link>
              <DeleteIcon
                onClick={trigger}
                isBeingDeleted={isMutating}
                showConfirmation={true}
                getConfirmationMessage={confirmationText}
              />
              {error && (
                <ErrorMessageModal
                  onClose={reset}
                  mainMessage={'Nepodařilo se odstranit typ práce.'}
                />
              )}
            </span>
          ),
          stickyRight: true,
        },
      ]}
    />
  )
}
