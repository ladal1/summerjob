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
              <div className="d-flex justify-content-between align-items-center">
                <h4>{item.name}</h4>
                <div className="allign-self-end">
                  <PostBubbleActions
                    post={item}
                    advancedAccess={advancedAccess}
                    onUpdated={onUpdated}
                  />
                </div>
              </div>
              <PostAddressAndDateTime item={item} />
              <span className="fs-6">{item.shortDescription}</span>
              <div className="d-flex justify-content-between align-items-center">
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
              </div>
            </div>
            <div
              className="d-flex justify-content-end"
              onClick={e => {
                e.stopPropagation()
              }}
            >
              <Participate id={item.id} />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
