import { PostComplete } from 'lib/types/post'
import { IconAndLabel } from '../forms/IconAndLabel'
import { postTagMappingWithIcon } from 'lib/data/enumMapping/postTagMapping'
import { PostBubbleActions } from './PostBubbleActions'

interface PostBubbleProps {
  item: PostComplete
}

export const PostBubble = ({ item }: PostBubbleProps) => {
  return (
    <div className="bg-white m-2">
      <div className="p-3">
        <div className="d-flex justify-content-between gap-3">
          <h3>{item.name}</h3>
          <PostBubbleActions postId={item.id} />
        </div>
        <div className="row">
          <div className="d-flex justify-content-start allign-items-center fs-6 text-muted">
            {item.address && (
              <IconAndLabel label={item.address} icon="fas fa-map" />
            )}
            {item.timeFrom && item.timeTo && (
              <IconAndLabel
                label={`${item.timeFrom} - ${item.timeTo}`}
                icon="fas fa-clock"
              />
            )}
            {item.availability.map(date => (
              <div key={`date-${date.toString()}`}>{date.toString()}</div>
            ))}
          </div>
        </div>
        <div className="row">
          <span className="fs-5">{item.shortDescription}</span>
        </div>
        <div className="row">
          <div className="d-flex justify-content-start allign-items-center fs-6 text-muted gap-2">
            {item.tags.map(tag => (
              <span key={tag}>{postTagMappingWithIcon[tag].name}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
