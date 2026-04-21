import Link from 'next/link'
import { FoodAllergyComplete } from 'lib/types/food-allergy'
import { useAPIFoodAllergyDelete } from 'lib/fetcher/food-allergy'
import DeleteIcon from '../table/icons/DeleteIcon'
import ErrorMessageModal from '../modal/ErrorMessageModal'
import { DndSortableRow } from '../table/DndSortableRow'

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

  const confirmationText = () => (
    <>
      <div>Opravdu chcete smazat alergii „{foodAllergy.name}“?</div>
      Pokud je přiřazená pracantům, může to ovlivnit jejich profil.
    </>
  )

  return (
    <DndSortableRow
      id={foodAllergy.id}
      data={[
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
                onClick={trigger}
                isBeingDeleted={isMutating}
                showConfirmation={true}
                getConfirmationMessage={confirmationText}
              />
              {error && (
                <ErrorMessageModal
                  onClose={reset}
                  mainMessage={'Nepodařilo se odstranit alergii na jídlo.'}
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
