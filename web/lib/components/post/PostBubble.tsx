import { postTagMappingWithIcon } from 'lib/data/enumMapping/postTagMapping'
import { PostComplete } from 'lib/types/post'
import { useState } from 'react'
import { PostAddressAndDateTime } from './PostAddressAndDateTime'
import { PostBubbleActions } from './PostBubbleActions'
import { PostModal } from './PostModal'
import { IconAndLabel } from '../forms/IconAndLabel'
import { Participate } from './Participate'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface PostBubbleProps {
  item: PostComplete
  advancedAccess?: boolean
  onUpdated?: () => void
  showTime?: boolean
  userId: string
}

export const PostBubble = ({
  item,
  advancedAccess = false,
  onUpdated,
  showTime = true,
  userId,
}: PostBubbleProps) => {
  const [isOpenedInfoModal, setIsOpenedInfoModal] = useState(false)
  const onCloseModal = () => {
    setIsOpenedInfoModal(false)
  }
  
  // Check if post has meaningful content
  const hasDescription = item.shortDescription && item.shortDescription.trim().length > 1
  const isCompact = !hasDescription
  
  return (
    <>
      <div
        className={`${
          onUpdated && item.isPinned
            ? 'smj-color-bubble-pinned'
            : 'smj-color-bubble'
        } rounded ${isCompact ? 'mt-1 mb-1' : 'mt-2 mb-2'} cursor-pointer smj-shadow`}
        onClick={() => setIsOpenedInfoModal(true)}
      >
        <div className={isCompact ? 'px-3 py-2' : 'p-3'}>
          <div className="d-flex justify-content-between gap-3">
            <h4 className={isCompact ? 'mb-1 fs-5' : ''}>{item.name}</h4>
            {onUpdated && (
              <div className="">
                <PostBubbleActions
                  post={item}
                  advancedAccess={advancedAccess}
                  onUpdated={onUpdated}
                />
              </div>
            )}
          </div>
          <PostAddressAndDateTime
            item={item}
            showTime={showTime}
            fontSize="fs-7"
          />
          {hasDescription && (
            <div className="fs-6 markdown-content">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {item.shortDescription}
              </ReactMarkdown>
            </div>
          )}
          <div className={`d-flex justify-content-between align-items-center ${isCompact ? 'mt-1' : ''}`}>
            <div className="d-flex flex-wrap fs-7 text-muted">
              {item.tags.map(tag => (
                <span key={tag} className="pill-static">
                  <IconAndLabel
                    icon={postTagMappingWithIcon[tag].icon ?? ''}
                    label={postTagMappingWithIcon[tag].name}
                  />
                </span>
              ))}
            </div>
            {item.maxParticipants && (
              <div className="fs-7 text-muted">
                Účastníků: {item.participants.length} / {item.maxParticipants}
                {item.participants.length >= item.maxParticipants && (
                  <span className="text-warning ms-1">• Plná</span>
                )}
              </div>
            )}
          </div>
          {onUpdated && (
            <div
              className="d-flex justify-content-end"
              onClick={e => {
                e.stopPropagation()
              }}
            >
              <Participate post={item} onUpdated={onUpdated} userId={userId} />
            </div>
          )}
        </div>
      </div>
      {isOpenedInfoModal && (
        <PostModal
          item={item}
          onClose={onCloseModal}
          onUpdated={onUpdated}
          userId={userId}
        />
      )}
    </>
  )
}
