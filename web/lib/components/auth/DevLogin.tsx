'use client'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

interface DevLoginProps {
  cookies: [{ name: string; value: string }]
  redirectUrl: string
}

export default function DevLogin({ cookies, redirectUrl }: DevLoginProps) {
  const router = useRouter()
  useEffect(() => {
    router.push(redirectUrl)
  })
  if (typeof window === 'undefined') {
    return <></>
  }
  cookies.forEach(({ name, value }) => {
    setCookie(name, value, 30)
  })
  return <></>
}

function setCookie(name: string, value: string, days: number) {
  const maxAge = days * 24 * 60 * 60
  const expires = '; max-age=' + maxAge
  document.cookie = name + '=' + (value || '') + expires + '; path=/'
}
