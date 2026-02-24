'use client'

import Image, { ImageProps } from 'next/image'
import { useState } from 'react'

const DEFAULT_AVATAR_SVG = (
  <svg
    viewBox="0 0 64 64"
    xmlns="http://www.w3.org/2000/svg"
    strokeWidth="3"
    stroke="#aaa"
    fill="none"
    style={{ width: '50%', height: '50%' }}
  >
    <circle cx="32" cy="18.14" r="11.14" />
    <path d="M54.55,56.85A22.55,22.55,0,0,0,32,34.3h0A22.55,22.55,0,0,0,9.45,56.85Z" />
  </svg>
)

type SafePhotoImageProps = Omit<ImageProps, 'onError'>

export function SafePhotoImage(props: SafePhotoImageProps) {
  const [hasError, setHasError] = useState(false)
  const src = typeof props.src === 'string' ? props.src : ''
  const isApiUrl = src.startsWith('/api/')

  if (hasError && isApiUrl) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          backgroundColor: '#f0f0f0',
          ...(props.style || {}),
        }}
        className={props.className}
      >
        {DEFAULT_AVATAR_SVG}
      </div>
    )
  }

  return (
    <Image
      {...props}
      unoptimized={isApiUrl}
      onError={() => setHasError(true)}
    />
  )
}
