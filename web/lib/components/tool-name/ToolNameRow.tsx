import Link from 'next/link'
import { ToolNameComplete } from 'lib/types/tool-name'
import { useAPIToolNameDelete } from 'lib/fetcher/tool-name'
import { SimpleRow } from '../table/SimpleRow'
import DeleteIcon from '../table/icons/DeleteIcon'
import ErrorMessageModal from '../modal/ErrorMessageModal'

interface ToolNameRowProps {
  toolName: ToolNameComplete
  onUpdated: () => void
}

export default function ToolNameRow({ toolName, onUpdated }: ToolNameRowProps) {
  const { trigger, isMutating, error, reset } = useAPIToolNameDelete(
    toolName.id,
    { onSuccess: onUpdated }
  )

  return (
    <SimpleRow
      key={toolName.id}
      data={formatToolNameRow(toolName, trigger, isMutating, error, reset)}
    />
  )
}

function formatToolNameRow(
  toolName: ToolNameComplete,
  onRequestDelete: () => void,
  isBeingDeleted: boolean,

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  deletingError: any,
  resetError: () => void
) {
  const confirmationText = () => (
    <>
      <div>Opravdu chcete smazat nástroj „{toolName.name}“?</div>
      Pokud je přiřazen k jobům, bude z nich smazán.
    </>
  )

  return [
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
            onClick={onRequestDelete}
            isBeingDeleted={isBeingDeleted}
            showConfirmation={true}
            getConfirmationMessage={confirmationText}
          />

          {deletingError && (
            <ErrorMessageModal
              onClose={resetError}
              mainMessage={'Nepodařilo se odstranit nástroj.'}
            />
          )}
        </span>
      ),
      stickyRight: true,
    },
  ]
}
