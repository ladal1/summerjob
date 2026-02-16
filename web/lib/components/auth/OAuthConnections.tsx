'use client'

import { signIn } from 'next-auth/react'
import { Label } from '../forms/Label'
import ButtonWithSvg from './ButtonWithSvg'

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
    <div className="d-inline-flex flex-column m-0">
      <Label id={id} label={label} margin={margin} />

      <div className="d-inline-flex flex-column gap-2">
        <ButtonWithSvg
          disabled={oauthLinks?.google ?? false}
          onClick={() => handleClick('google')}
          iconSrc="/icons/google.svg"
          type="button"
        >
          {oauthLinks?.google
            ? 'Google účet je propojen'
            : 'Propojit Google účet'}
        </ButtonWithSvg>

        <ButtonWithSvg
          disabled={oauthLinks?.seznam ?? false}
          onClick={() => handleClick('seznam')}
          iconSrc="/icons/seznam.svg"
          type="button"
        >
          {oauthLinks?.seznam
            ? 'Seznam účet je propojen'
            : 'Propojit Seznam účet'}
        </ButtonWithSvg>
      </div>
    </div>
  )
}
