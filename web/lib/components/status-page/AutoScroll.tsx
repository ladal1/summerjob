'use client'

import { useEffect, useRef } from 'react'

interface AutoScrollProps {
  intervalMs: number
  stepPx: number
  children: React.ReactNode
}

export default function AutoScroll({
  intervalMs,
  stepPx,
  children,
}: AutoScrollProps) {
  const direction = useRef(1) // 1 == down, -1 == up
  useEffect(() => {
    const id = window.setInterval(() => {
      const maxScrollY =
        document.documentElement.scrollHeight - window.innerHeight

      // Calculate the next y value and scroll to it
      const nextY =
        direction.current === 1
          ? Math.min(window.scrollY + stepPx, maxScrollY)
          : Math.max(window.scrollY - stepPx, 0)
      window.scrollTo(0, nextY)

      // Check if the top or the bottom of the page has been reached and flip the direction if so
      const hitBottom = nextY >= maxScrollY
      const hitTop = nextY <= 0
      if (direction.current === 1 && hitBottom) {
        direction.current = -1
      }
      if (direction.current === -1 && hitTop) {
        direction.current = 1
      }
    }, intervalMs)

    return () => window.clearInterval(id)
  }, [intervalMs, stepPx])

  return <div>{children}</div>
}
