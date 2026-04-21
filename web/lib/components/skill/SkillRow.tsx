import Link from 'next/link'
import { SkillHasComplete } from 'lib/types/skill'
import { useAPISkillDelete } from 'lib/fetcher/skill'
import DeleteIcon from '../table/icons/DeleteIcon'
import ErrorMessageModal from '../modal/ErrorMessageModal'
import { DndSortableRow } from '../table/DndSortableRow'

interface SkillRowProps {
  skill: SkillHasComplete
  onUpdated: () => void
}

export default function SkillRow({ skill, onUpdated }: SkillRowProps) {
  const { trigger, isMutating, error, reset } = useAPISkillDelete(skill.id, {
    onSuccess: onUpdated,
  })

  const confirmationText = () => (
    <>
      <div>Opravdu chcete smazat dovednost „{skill.name}“?</div>
      Pokud je přiřazená pracantům, může to ovlivnit jejich profil.
    </>
  )

  return (
    <DndSortableRow
      id={skill.id}
      data={[
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
                onClick={trigger}
                isBeingDeleted={isMutating}
                showConfirmation={true}
                getConfirmationMessage={confirmationText}
              />
              {error && (
                <ErrorMessageModal
                  onClose={reset}
                  mainMessage={'Nepodařilo se odstranit dovednost.'}
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
