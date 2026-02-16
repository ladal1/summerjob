'use client'

import { signIn } from 'next-auth/react'
import { Label } from '../forms/Label'

interface OAuthConnectionsProps {
  id?: string
  label: string
  oauthLinks?: { google: boolean; seznam: boolean }
  margin?: boolean
}

export default function OAuthConnections({
  id = 'oauthConnections',
  label,
  oauthLinks,
  margin = true,
}: OAuthConnectionsProps) {
  const handleClick = async (provider: 'google' | 'seznam') => {
    await signIn(provider, { callbackUrl: '/profile' })
  }

  return (
    <div className="d-flex flex-column m-0">
      <Label id={id} label={label} margin={margin} />

      <div className="d-flex flex-column gap-2 w-25">
        <button
          type="button"
          className="btn btn-light p-2"
          disabled={oauthLinks?.google}
          onClick={() => handleClick('google')}
        >
          {oauthLinks?.google
            ? 'Google účet je propojen'
            : 'Propojit Google účet'}
        </button>

        <button
          type="button"
          className="btn btn-light p-2"
          disabled={oauthLinks?.seznam}
          onClick={() => handleClick('seznam')}
        >
          {oauthLinks?.seznam
            ? 'Seznam účet je propojen'
            : 'Propojit Seznam účet'}
        </button>
      </div>
    </div>
  )
}
