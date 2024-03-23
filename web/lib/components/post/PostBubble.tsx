import { postTagMappingWithIcon } from 'lib/data/enumMapping/postTagMapping'
import { PostComplete } from 'lib/types/post'
import { useState } from 'react'
import { PostAddressAndDateTime } from './PostAddressAndDateTime'
import { PostBubbleActions } from './PostBubbleActions'
import { PostModal } from './PostModal'
import { IconAndLabel } from '../forms/IconAndLabel'
import { Participate } from './Participate'

interface PostBubbleProps {
  item: PostComplete
  advancedAccess: boolean
  onUpdated: () => void
}

export const PostBubble = ({
  item,
  advancedAccess,
  onUpdated,
}: PostBubbleProps) => {
  const [isOpenedInfoModal, setIsOpenedInfoModal] = useState(false)
  const onCloseModal = () => {
    setIsOpenedInfoModal(false)
  }
  return (
    <>
      {isOpenedInfoModal && <PostModal item={item} onClose={onCloseModal} />}
      <div
        className={`${
          item.isPinned ? 'smj-color-bubble-pinned' : 'smj-color-bubble'
        } rounded m-2 cursor-pointer`}
        onClick={() => setIsOpenedInfoModal(true)}
      >
        <div className="p-3">
          <div className="row">
            <div className="col">
              <h4>{item.name}</h4>
              <PostAddressAndDateTime item={item} />
              <span className="fs-5">{item.shortDescription}</span>
              <div className="d-flex flex-wrap fs-6 text-muted">
                {item.tags.map(tag => (
                  <span key={tag} className="pill-static">
                    <IconAndLabel
                      icon={postTagMappingWithIcon[tag].icon ?? ''}
                      label={postTagMappingWithIcon[tag].name}
                    />
                  </span>
                ))}
              </div>
            </div>{' '}
            <div className="col d-flex flex-column">
              <div className="d-flex justify-content-end">
                <PostBubbleActions
                  post={item}
                  advancedAccess={advancedAccess}
                  onUpdated={onUpdated}
                />
              </div>
              <div
                className="d-flex justify-content-end mt-auto"
                onClick={e => {
                  e.stopPropagation()
                }}
              >
                <Participate id={item.id} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
