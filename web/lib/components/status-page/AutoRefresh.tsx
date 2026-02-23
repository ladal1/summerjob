'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface AutoRefreshProps {
  seconds: number
}

export default function AutoRefresh({ seconds }: AutoRefreshProps) {
  const router = useRouter()

  useEffect(() => {
    const id = setInterval(() => {
      router.refresh()
    }, seconds * 1000)

    return () => clearInterval(id)
  }, [router, seconds])

  return null
}
