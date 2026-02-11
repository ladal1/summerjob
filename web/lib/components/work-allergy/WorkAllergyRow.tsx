import Link from 'next/link'
import { WorkAllergyComplete } from 'lib/types/work-allergy'
import { useAPIWorkAllergyDelete } from 'lib/fetcher/work-allergy'
import { SimpleRow } from '../table/SimpleRow'
import DeleteIcon from '../table/icons/DeleteIcon'
import ErrorMessageModal from '../modal/ErrorMessageModal'

interface WorkAllergyRowProps {
  workAllergy: WorkAllergyComplete
  onUpdated: () => void
}

export default function WorkAllergyRow({
  workAllergy,
  onUpdated,
}: WorkAllergyRowProps) {
  const { trigger, isMutating, error, reset } = useAPIWorkAllergyDelete(
    workAllergy.id,
    { onSuccess: onUpdated }
  )

  return (
    <SimpleRow
      key={workAllergy.id}
      data={formatWorkAllergyRow(
        workAllergy,
        trigger,
        isMutating,
        error,
        reset
      )}
    />
  )
}

function formatWorkAllergyRow(
  workAllergy: WorkAllergyComplete,
  onRequestDelete: () => void,
  isBeingDeleted: boolean,
   
  deletingError: any,
  resetError: () => void
) {
  const confirmationText = () => (
    <>
      <div>Opravdu chcete smazat alergii „{workAllergy.name}“?</div>
      Alergie bude odebrána ze všech pracantů a jobů, u kterých je přiřazena.
    </>
  )

  return [
    { content: workAllergy.name },
    {
      content: (
        <span
          key={`actions-${workAllergy.id}`}
          className="d-flex align-items-center gap-3"
        >
          <Link
            href={`/admin/lists/work-allergies/${workAllergy.id}`}
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
              mainMessage={'Nepodařilo se odstranit pracovní alergii.'}
            />
          )}
        </span>
      ),
      stickyRight: true,
    },
  ]
}
