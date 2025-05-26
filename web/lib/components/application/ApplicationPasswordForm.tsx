'use client'

import { useState } from 'react'

export default function ApplicationPasswordForm({
  eventId,
  onSuccess,
}: {
  eventId: string
  onSuccess: () => void
}) {
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    setLoading(true)
    setError('')

    try {
      const res = await fetch(
        `/api/summerjob-events/${eventId}/check-password`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password }),
        }
      )

      const data: { valid: boolean } = await res.json()

      if (res.ok && data.valid) {
        localStorage.setItem(`application-password-${eventId}`, password)
        onSuccess()
      } else {
        setError('Nesprávné heslo, zkuste to znovu.')
      }
    } catch (err) {
      console.error(err)
      setError('Nastala chyba při ověřování hesla.')
    }

    setLoading(false)
  }

  return (
    <div
      className="bg-white rounded shadow p-4 p-md-5 mx-auto"
      style={{ maxWidth: '420px' }}
    >
      <h2 className="h5 mb-3 text-center">Přihláška chráněná heslem</h2>
      <p className="text-muted text-center mb-4">
        Pro zobrazení přihlášky zadejte přístupové heslo, které jste obdržel/a.
      </p>

      <div className="d-flex flex-column gap-3">
        <input
          type="password"
          className="form-control form-control-lg"
          placeholder="Zadejte heslo"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') handleSubmit()
          }}
        />
        <button
          className="btn btn-primary btn-lg"
          onClick={handleSubmit}
          disabled={loading || !password}
        >
          {loading ? (
            <span
              className="spinner-border spinner-border-sm me-2"
              role="status"
            />
          ) : null}
          Odemknout přihlášku
        </button>
        {error && <div className="text-danger text-center">{error}</div>}
      </div>
    </div>
  )
}
