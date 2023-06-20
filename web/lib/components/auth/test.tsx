'use client'
import { UserSession } from 'lib/types/auth'
import { signIn, signOut } from 'next-auth/react'

interface LoginClientTestProps {
  session: UserSession | null
}

export function LoginClientTest({ session }: LoginClientTestProps) {
  return (
    <div>
      <h1>Test Client API</h1>
      {session && <button onClick={() => signOut()}>Sign out</button>}
      {!session && <button onClick={() => signIn()}>Sign in</button>}
    </div>
  )
}
