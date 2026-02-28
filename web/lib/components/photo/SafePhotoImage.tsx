import Image from 'next/image'
import { useState } from 'react'

interface SafePhotoImageProps {
  src: string
  alt: string
  style?: React.CSSProperties
  width?: number
  height?: number
  quality?: number
  fill?: boolean
  sizes?: string
  loading?: 'eager' | 'lazy'
  priority?: boolean
  onClick?: () => void
  onMouseDown?: (e: React.MouseEvent) => void
  onLoadingComplete?: (result: {
    naturalWidth: number
    naturalHeight: number
  }) => void
  className?: string
}

const DEFAULT_AVATAR_SVG = (
  <svg
    viewBox="0 0 64 64"
    xmlns="http://www.w3.org/2000/svg"
    strokeWidth="3"
    stroke="#000000"
    fill="none"
    style={{ width: '100%', height: '100%' }}
  >
    <circle cx="32" cy="18.14" r="11.14" />
    <path d="M54.55,56.85A22.55,22.55,0,0,0,32,34.3h0A22.55,22.55,0,0,0,9.45,56.85Z" />
  </svg>
)

/**
 * SafePhotoImage is a thin wrapper around `next/image` that adds safer handling
 * for images served from dynamic or error‑prone sources (e.g. `/api/` routes).
 *
 * When the `src` starts with `/api/`, image optimization is disabled via the
 * `unoptimized` prop to avoid Sharp errors that can occur when optimizing
 * API‑backed images.
 *
 * If an image load error occurs (`onError`), and the `src` is an `/api/` URL,
 * the component renders a generic fallback avatar SVG sized using either the
 * provided `width`/`height` or `fill`/`style` props instead of the broken image.
 *
 * Use this component instead of `next/image` when:
 * - You are rendering images from `/api/` endpoints or other unstable sources.
 * - You want a built‑in, neutral avatar fallback when loading fails.
 *
 * All props other than `src` and `alt` are passed directly through to
 * `next/image`.
 */
export const SafePhotoImage = ({ src, alt, ...props }: SafePhotoImageProps) => {
  const [hasError, setHasError] = useState(false)

  // If it's an API URL and we have an error, show fallback
  if (hasError && src.startsWith('/api/')) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: props.fill ? '100%' : props.width,
          height: props.fill ? '100%' : props.height,
          ...props.style,
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
      src={src}
      alt={alt}
      onError={() => {
        setHasError(true)
      }}
      // Disable optimization for API routes to prevent Sharp errors
      unoptimized={src.startsWith('/api/')}
    />
  )
}
