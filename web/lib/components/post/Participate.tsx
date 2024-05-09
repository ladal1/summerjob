import { useAPIPostUpdate } from 'lib/fetcher/post'
import { PostComplete } from 'lib/types/post'
import { useCallback, useEffect, useState } from 'react'

interface ParticipateProps {
  post: PostComplete
  onUpdated: () => void
  userId: string
}

export const Participate = ({ post, onUpdated, userId }: ParticipateProps) => {
  const isEnrolled = useCallback(() => {
    return (
      post.participants &&
      post.participants.map(t => t.workerId).includes(userId)
    )
  }, [post.participants, userId])

  const [checked, setChecked] = useState(post.isMandatory || isEnrolled)

  const { trigger, isMutating } = useAPIPostUpdate(post.id, {
    onSuccess: onUpdated,
  })

  const triggerParticipate = (isEnrolled: boolean) => {
    trigger({ participateChange: { workerId: userId, isEnrolled } })
  }

  const isDisabled = () => {
    return post.isMandatory || isMutating
  }

  useEffect(() => {
    setChecked(post.isMandatory || isEnrolled)
  }, [isEnrolled, post.isMandatory])

  return (
    <>
      {(post.isMandatory || post.isOpenForParticipants) && (
        <div className="form-check align-self-center align-items-center d-flex ">
          <label
            className="form-check-label fs-7 text-truncate cursor-pointer"
            htmlFor={post.id}
          >
            <span className={`${isDisabled() ? 'text-muted' : 'fw-bold'}`}>
              Zúčastním se
            </span>
          </label>
          <input
            className="form-check-input smj-checkbox ms-2 cursor-default"
            type="checkbox"
            id={post.id}
            disabled={isDisabled()}
            checked={checked}
            onChange={e => {
              e.stopPropagation()
              triggerParticipate(!checked)
            }}
          />
        </div>
      )}
    </>
  )
}
