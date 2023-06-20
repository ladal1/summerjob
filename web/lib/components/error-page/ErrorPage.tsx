'use client'

import { ApiError } from 'lib/types/api-error'
import { useEffect, useState } from 'react'

type ErrorPageProps = {
  error: Error | string
}

export default function ErrorPage({ error }: ErrorPageProps) {
  const message = error instanceof Error ? error.message : error
  const isApiError = error instanceof ApiError
  const [isOffline, setIsOffline] = useState(false)

  useEffect(() => {
    if (window.navigator) {
      setIsOffline(!window.navigator.onLine)
    }
  }, [setIsOffline])

  return (
    <section className="mb-3 mt-3">
      <div className="container">
        <div className="row">
          <div className="col">
            <h1>Došlo k chybě</h1>
            <p>
              Chyba:{' '}
              {error && (
                <span className="font-monospace">
                  {isApiError ? error.reason : message}
                </span>
              )}
            </p>
            {isApiError && (
              <p className="font-monospace text-muted">{message}</p>
            )}
            {isOffline && <p>Zkontrolujte připojení k internetu.</p>}
          </div>
        </div>
      </div>
    </section>
  )
}
