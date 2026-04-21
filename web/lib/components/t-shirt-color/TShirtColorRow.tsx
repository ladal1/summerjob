import Link from 'next/link'
import { TShirtColorComplete } from 'lib/types/t-shirt-color'
import { useAPITShirtColorDelete } from 'lib/fetcher/t-shirt-color'
import DeleteIcon from '../table/icons/DeleteIcon'
import ErrorMessageModal from '../modal/ErrorMessageModal'
import { DndSortableRow } from '../table/DndSortableRow'

interface TShirtColorRowProps {
  tShirtColor: TShirtColorComplete
  onUpdated: () => void
}

export default function TShirtColorRow({
  tShirtColor,
  onUpdated,
}: TShirtColorRowProps) {
  const { trigger, isMutating, error, reset } = useAPITShirtColorDelete(
    tShirtColor.id,
    { onSuccess: onUpdated }
  )

  const confirmationText = () => (
    <>
      <div>Opravdu chcete smazat barvu „{tShirtColor.name}“?</div>U přihlášek,
      které ji používají, se údaj barvy smaže.
    </>
  )

  return (
    <DndSortableRow
      id={tShirtColor.id}
      data={[
        { content: tShirtColor.name },
        {
          content: (
            <span
              key={`actions-${tShirtColor.id}`}
              className="d-flex align-items-center gap-3"
            >
              <Link
                href={`/admin/lists/t-shirt-colors/${tShirtColor.id}`}
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
                  mainMessage={'Nepodařilo se odstranit barvu trička.'}
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
