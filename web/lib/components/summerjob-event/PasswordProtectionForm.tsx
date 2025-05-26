import { useState } from 'react'

export default function PasswordProtectionForm({
  eventId,
  initialEnabled,
}: {
  eventId: string
  initialEnabled: boolean
}) {
  const [enabled, setEnabled] = useState(initialEnabled)
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const handleToggle = async () => {
    setLoading(true)
    setMessage(null)

    const res = await fetch(
      `/api/summerjob-events/${eventId}/set-password-protection`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enable: !enabled, password }),
      }
    )

    if (!res.ok) {
      setMessage('Chyba při ukládání.')
    } else {
      const data = await res.json()
      setEnabled(data.isPasswordProtected)
      setPassword('')
      setMessage('Nastavení uloženo.')

      setTimeout(() => setMessage(null), 2000)
    }

    setLoading(false)
  }

  return (
    <div className="mt-3">
      <div className="mb-2">
        <label className="fs-5">Heslem chráněná přihláška</label>
        <p className="text-muted">
          Pokud je zapnuto, musí uživatel zadat heslo pro zobrazení přihlášky.
        </p>
      </div>

      <div className="d-flex gap-5 align-items-center flex-column flex-sm-row">
        {!enabled && (
          <input
            type="text"
            className="form-control flex-grow-1 p-0"
            placeholder="Zadejte nové heslo"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
        )}

        <button
          className="btn btn-outline-primary text-nowrap"
          onClick={handleToggle}
          disabled={loading || (!enabled && !password)}
        >
          {enabled ? 'Vypnout ochranu' : 'Zapnout ochranu'}
        </button>
      </div>

      {message && <p className="text-success mt-2">{message}</p>}
    </div>
  )
}
