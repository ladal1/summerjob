import Link from 'next/link'
import DeleteIcon from '../forms/DeleteIcon'

interface PostBubbleActionsProps {
  postId: string
  advancedAccess: boolean
}

export const PostBubbleActions = ({
  postId,
  advancedAccess,
}: PostBubbleActionsProps) => {
  return (
    <span className="d-flex align-items-center gap-3">
      {advancedAccess && (
        <Link
          href={`/posts/${postId}`}
          onClick={e => e.stopPropagation()}
          className="smj-action-edit"
        >
          <i className="fas fa-edit" title="Upravit"></i>
        </Link>
      )}
    </span>
  )
}
/*

      <DeleteIcon
        onClick={onRequestDelete}
        isBeingDeleted={isBeingDeleted}
        showConfirmation={true}
        getConfirmationMessage={confirmationText}
      />
      {deletingError && (
        <ErrorMessageModal
          onClose={resetError}
          mainMessage={'Nepodařilo se odstranit pracanta.'}
        />
      )} */
