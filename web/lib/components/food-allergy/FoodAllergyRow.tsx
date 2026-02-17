import Link from 'next/link'
import { FoodAllergyComplete } from 'lib/types/food-allergy'
import { useAPIFoodAllergyDelete } from 'lib/fetcher/food-allergy'
import { SimpleRow } from '../table/SimpleRow'
import DeleteIcon from '../table/icons/DeleteIcon'
import ErrorMessageModal from '../modal/ErrorMessageModal'

interface FoodAllergyRowProps {
  foodAllergy: FoodAllergyComplete
  onUpdated: () => void
}

export default function FoodAllergyRow({
  foodAllergy,
  onUpdated,
}: FoodAllergyRowProps) {
  const { trigger, isMutating, error, reset } = useAPIFoodAllergyDelete(
    foodAllergy.id,
    { onSuccess: onUpdated }
  )

  return (
    <SimpleRow
      key={foodAllergy.id}
      data={formatFoodAllergyRow(
        foodAllergy,
        trigger,
        isMutating,
        error,
        reset
      )}
    />
  )
}

function formatFoodAllergyRow(
  foodAllergy: FoodAllergyComplete,
  onRequestDelete: () => void,
  isBeingDeleted: boolean,

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  deletingError: any,
  resetError: () => void
) {
  const confirmationText = () => (
    <>
      <div>Opravdu chcete smazat alergii „{foodAllergy.name}“?</div>
      Pokud je přiřazená pracantům, může to ovlivnit jejich profil.
    </>
  )

  return [
    { content: foodAllergy.name },
    {
      content: (
        <span
          key={`actions-${foodAllergy.id}`}
          className="d-flex align-items-center gap-3"
        >
          <Link
            href={`/admin/lists/food-allergies/${foodAllergy.id}`}
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
