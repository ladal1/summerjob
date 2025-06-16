import Image from 'next/image'

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
          <Image
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
          <svg
            viewBox="0 0 64 64"
            xmlns="http://www.w3.org/2000/svg"
            strokeWidth="3"
            stroke="#000000"
            fill="none"
          >
            <circle cx="32" cy="18.14" r="11.14" />
            <path d="M54.55,56.85A22.55,22.55,0,0,0,32,34.3h0A22.55,22.55,0,0,0,9.45,56.85Z" />
          </svg>
        )}
      </div>
    </div>
  )
}
