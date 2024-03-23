import Link from 'next/link'
import DeleteIcon from '../forms/DeleteIcon'
import { PostComplete } from 'lib/types/post'
import ErrorMessageModal from '../modal/ErrorMessageModal'
import { useAPIPostDelete, useAPIPostUpdate } from 'lib/fetcher/post'
import { PinIcon } from '../forms/PinIcon'

interface PostBubbleActionsProps {
  post: PostComplete
  advancedAccess: boolean
  onUpdated: () => void
}

export const PostBubbleActions = ({
  post,
  advancedAccess,
  onUpdated,
}: PostBubbleActionsProps) => {
  const { trigger, isMutating, error, reset } = useAPIPostDelete(post.id, {
    onSuccess: onUpdated,
  })

  const confirmationText = () => {
    return (
      <>
        <div>Opravdu chcete smazat příspěvek {post.name}?</div>
        Dojde také k odhlášení všech uživatelů z této události.
      </>
    )
  }

  const { trigger: triggerUpdate } = useAPIPostUpdate(post.id, {
    onSuccess: onUpdated,
  })

  const setPinned = (pinned: boolean) => {
    triggerUpdate({ isPinned: pinned })
  }

  return (
    <span
      className="d-flex align-items-center gap-3"
      onClick={e => e.stopPropagation()}
    >
      {advancedAccess ? (
        <>
          <PinIcon isPinned={post.isPinned} setPinned={setPinned} />
          <Link
            href={`/posts/${post.id}`}
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
              mainMessage={'Nepodařilo se odstranit pracanta.'}
            />
          )}
        </>
      ) : (
        <>
          {post.isPinned && (
            <i
              className="fas fa-thumbtack smj-action-pinned"
              onClick={e => {
                setPinned(!post.isPinned)
              }}
            ></i>
          )}
        </>
      )}
    </span>
  )
}
