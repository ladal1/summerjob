import Link from 'next/link'
import { JobTypeComplete } from 'lib/types/job-type'
import { useAPIJobTypeDelete } from 'lib/fetcher/job-type'
import { SimpleRow } from '../table/SimpleRow'
import DeleteIcon from '../table/icons/DeleteIcon'
import ErrorMessageModal from '../modal/ErrorMessageModal'

interface JobTypeRowProps {
  jobType: JobTypeComplete
  onUpdated: () => void
}

export default function JobTypeRow({ jobType, onUpdated }: JobTypeRowProps) {
  const { trigger, isMutating, error, reset } = useAPIJobTypeDelete(
    jobType.id,
    { onSuccess: onUpdated }
  )

  return (
    <SimpleRow
      key={jobType.id}
      data={formatJobTypeRow(jobType, trigger, isMutating, error, reset)}
    />
  )
}

function formatJobTypeRow(
  jobType: JobTypeComplete,
  onRequestDelete: () => void,
  isBeingDeleted: boolean,

  deletingError: any,
  resetError: () => void
) {
  const confirmationText = () => (
    <>
      <div>Opravdu chcete smazat typ práce „{jobType.name}“?</div>
      Pokud je přiřazen jobům nebo nástrojům, bude z nich odstraněn.
    </>
  )

  return [
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
            onClick={onRequestDelete}
            isBeingDeleted={isBeingDeleted}
            showConfirmation={true}
            getConfirmationMessage={confirmationText}
          />

          {deletingError && (
            <ErrorMessageModal
              onClose={resetError}
              mainMessage={'Nepodařilo se odstranit alergii na jídlo.'}
            />
          )}
        </span>
      ),
      stickyRight: true,
    },
  ]
}
