import { SafePhotoImage } from './SafePhotoImage'
import { DefaultAvatarSVG } from './DefaultAvatarSVG'

interface PhotoViewerProps {
  photoURL: string | null
  alt: string
}

export const PhotoViewer = ({ photoURL, alt }: PhotoViewerProps) => {
  return (
    <div className="smj-sticky-col-top" style={{ zIndex: '300' }}>
      <div className="vstack smj-search-stack smj-shadow rounded-3">
        <h5>Foto</h5>
        <hr />
        {photoURL ? (
          <SafePhotoImage
            src={photoURL}
            alt={alt}
            style={{
              objectFit: 'cover',
              width: '100%',
              height: '100%',
            }}
            quality={50}
            width={500}
            height={500}
          />
        ) : (
          <DefaultAvatarSVG />
        )}
      </div>
    </div>
  )
}
