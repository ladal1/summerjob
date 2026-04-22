import Link from 'next/link'
import { ToolNameComplete } from 'lib/types/tool-name'
import { useAPIToolNameDelete } from 'lib/fetcher/tool-name'
import DeleteIcon from '../table/icons/DeleteIcon'
import ErrorMessageModal from '../modal/ErrorMessageModal'
import { DndSortableRow } from '../table/DndSortableRow'

interface ToolNameRowProps {
  toolName: ToolNameComplete
  onUpdated: () => void
}

export default function ToolNameRow({ toolName, onUpdated }: ToolNameRowProps) {
  const { trigger, isMutating, error, reset } = useAPIToolNameDelete(
    toolName.id,
    { onSuccess: onUpdated }
  )

  const confirmationText = () => (
    <>
      <div>Opravdu chcete smazat nástroj „{toolName.name}“?</div>
      Pokud je přiřazen k jobům, bude z nich smazán.
    </>
  )

  return (
    <DndSortableRow
      id={toolName.id}
      data={[
        { content: toolName.name },
        { content: toolName.skills.map(s => s.name).join(', ') },
        { content: toolName.jobTypes.map(jt => jt.name).join(', ') },
        {
          content: (
            <span
              key={`actions-${toolName.id}`}
              className="d-flex align-items-center gap-3"
            >
              <Link
                href={`/admin/lists/tool-names/${toolName.id}`}
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
                  mainMessage={'Nepodařilo se odstranit nástroj.'}
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
