import { PostComplete } from 'lib/types/post'
import { IconAndLabel } from '../forms/IconAndLabel'
import { postTagMappingWithIcon } from 'lib/data/enumMapping/postTagMapping'

interface PostCardProps {
  post: PostComplete
}

export default async function PostCard({ post }: PostCardProps) {
  const hasTime = post.timeFrom !== null && post.timeTo !== null
  const hasAddress = post.address !== null
  const hasDescription =
    post.shortDescription && post.shortDescription.trim().length > 1

  return (
    <div className="smj-color-bubble rounded p-2 smj-shadow h-100">
      <h4 className="fs-4 mb-1">{post.name}</h4>
      <div className="d-flex flex-column gap-6">
        {hasTime && (
          <span>
            <i className="fas fa-clock me-1"></i>
            {post.timeFrom} - {post.timeTo}
          </span>
        )}

        {hasAddress && (
          <span>
            <i className="fas fa-map me-1"></i>
            {post.address}
          </span>
        )}

        {hasDescription && <span>{post.shortDescription}</span>}

        {post.tags.length > 0 && (
          <div className="d-flex flex-wrap fs-7 text-muted">
            {post.tags.map(tag => (
              <span key={tag} className="pill-static">
                <IconAndLabel
                  icon={postTagMappingWithIcon[tag].icon ?? ''}
                  label={postTagMappingWithIcon[tag].name}
                />
              </span>
            ))}
          </div>
        )}

        {post.isMandatory && (
          <div className="bg-danger text-light rounded px-2 my-1 align-self-start">
            POVINNÁ ÚČAST
          </div>
        )}

        {post.isOpenForParticipants && (
          <div className="bg-success text-light rounded px-2 my-1 align-self-start">
            MOŽNOST ZAPSÁNÍ
          </div>
        )}
      </div>
    </div>
  )
}
