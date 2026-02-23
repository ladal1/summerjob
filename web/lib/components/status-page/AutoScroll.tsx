'use client'

import { useEffect } from 'react'

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
  let direction = 1 // 1 == down, -1 == up
  useEffect(() => {
    const id = window.setInterval(() => {
      const maxScrollY =
        document.documentElement.scrollHeight - window.innerHeight

      // Calculate the next y value and scroll to it
      const nextY =
        direction === 1
          ? Math.min(window.scrollY + stepPx, maxScrollY)
          : Math.max(window.scrollY - stepPx, 0)
      window.scrollTo(0, nextY)

      // Check if the top or the bottom of the page has been reached and flip the direction if so
      const hitBottom = nextY >= maxScrollY
      const hitTop = nextY <= 0
      if (direction === 1 && hitBottom) {
        direction = -1
      }
      if (direction === -1 && hitTop) {
        direction = 1
      }
    }, intervalMs)

    return () => window.clearInterval(id)
  }, [])

  return <div>{children}</div>
}
