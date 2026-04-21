import Link from 'next/link'
import { TShirtSizeComplete } from 'lib/types/t-shirt-size'
import { useAPITShirtSizeDelete } from 'lib/fetcher/t-shirt-size'
import DeleteIcon from '../table/icons/DeleteIcon'
import ErrorMessageModal from '../modal/ErrorMessageModal'
import { DndSortableRow } from '../table/DndSortableRow'

interface TShirtSizeRowProps {
  tShirtSize: TShirtSizeComplete
  onUpdated: () => void
}

export default function TShirtSizeRow({
  tShirtSize,
  onUpdated,
}: TShirtSizeRowProps) {
  const { trigger, isMutating, error, reset } = useAPITShirtSizeDelete(
    tShirtSize.id,
    { onSuccess: onUpdated }
  )

  const confirmationText = () => (
    <>
      <div>Opravdu chcete smazat velikost „{tShirtSize.name}“?</div>U přihlášek,
      které ji používají, se údaj velikosti smaže.
    </>
  )

  return (
    <DndSortableRow
      id={tShirtSize.id}
      data={[
        { content: tShirtSize.name },
        {
          content: (
            <span
              key={`actions-${tShirtSize.id}`}
              className="d-flex align-items-center gap-3"
            >
              <Link
                href={`/admin/lists/t-shirt-sizes/${tShirtSize.id}`}
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
                  mainMessage={'Nepodařilo se odstranit velikost trička.'}
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
