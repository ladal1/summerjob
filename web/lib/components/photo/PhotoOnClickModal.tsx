import Image from 'next/image'
import { useState } from 'react'
import PhotoModal from '../modal/PhotoModal'

interface PhotoOnClickModalProps {
  photoURL: string
  alt?: string
  width?: number
  height?: number
}

export function PhotoOnClickModal({
  photoURL,
  alt = 'Fotografie',
  width = 400,
  height = 400,
}: PhotoOnClickModalProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <div
        role="button"
        style={{ width, height, cursor: 'pointer', position: 'relative' }}
        className="border rounded overflow-hidden"
        onClick={() => setOpen(true)}
      >
        <Image
          src={photoURL}
          alt={alt}
          fill
          sizes="100vw"
          style={{ objectFit: 'cover' }}
        />
      </div>
      {open && <PhotoModal photo={photoURL} onClose={() => setOpen(false)} />}
    </>
  )
}
