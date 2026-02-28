import Image from 'next/image'
import { useState } from 'react'
import { DefaultAvatarSVG } from './DefaultAvatarSVG'

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
        onClick={props.onClick}
        onMouseDown={props.onMouseDown}
      >
        <DefaultAvatarSVG style={{ width: '100%', height: '100%' }} />
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
