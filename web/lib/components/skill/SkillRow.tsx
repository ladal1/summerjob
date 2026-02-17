import Link from 'next/link'
import { SkillHasComplete } from 'lib/types/skill'
import { useAPISkillDelete } from 'lib/fetcher/skill'
import { SimpleRow } from '../table/SimpleRow'
import DeleteIcon from '../table/icons/DeleteIcon'
import ErrorMessageModal from '../modal/ErrorMessageModal'

interface SkillRowProps {
  skill: SkillHasComplete
  onUpdated: () => void
}

export default function SkillRow({ skill, onUpdated }: SkillRowProps) {
  const { trigger, isMutating, error, reset } = useAPISkillDelete(skill.id, {
    onSuccess: onUpdated,
  })

  return (
    <SimpleRow
      key={skill.id}
      data={formatSkillRow(skill, trigger, isMutating, error, reset)}
    />
  )
}

function formatSkillRow(
  skill: SkillHasComplete,
  onRequestDelete: () => void,
  isBeingDeleted: boolean,

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  deletingError: any,
  resetError: () => void
) {
  const confirmationText = () => (
    <>
      <div>Opravdu chcete smazat dovednost „{skill.name}“?</div>
      Pokud je přiřazená pracantům, může to ovlivnit jejich profil.
    </>
  )

  return [
    { content: skill.name },
    {
      content: (
        <span
          key={`actions-${skill.id}`}
          className="d-flex align-items-center gap-3"
        >
          <Link
            href={`/admin/lists/skills/${skill.id}`}
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
              mainMessage={'Nepodařilo se odstranit dovednost.'}
            />
          )}
        </span>
      ),
      stickyRight: true,
    },
  ]
}
