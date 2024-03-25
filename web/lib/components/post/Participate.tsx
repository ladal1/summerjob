import { useAPIPostUpdate } from 'lib/fetcher/post'
import { PostComplete } from 'lib/types/post'

interface ParticipateProps {
  post: PostComplete
  onUpdated: () => void
  userId: string
}

// TODO
export const Participate = ({ post, onUpdated, userId }: ParticipateProps) => {
  const { trigger, isMutating, error, reset } = useAPIPostUpdate(post.id, {
    onSuccess: onUpdated,
  })

  const triggerParticipate = () => {
    trigger({ newParticipantId: userId })
  }

  return (
    <>
      {post.isMandatory ||
        (post.isOpenForParticipants && (
          <div className="form-check align-self-center align-posts-center d-flex ">
            <label
              className="form-check-label fs-7 text-truncate"
              htmlFor={post.id}
            >
              <b>Zúčastním se</b>
            </label>
            <input
              className="form-check-input smj-checkbox ms-2"
              type="checkbox"
              id={post.id}
              disabled={post.isMandatory}
              checked={post.isMandatory}
              onClick={e => {
                e.stopPropagation()
                triggerParticipate()
              }}
            />
          </div>
        ))}
    </>
  )
}
