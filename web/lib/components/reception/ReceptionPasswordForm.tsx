'use client'

import { useState } from 'react'

interface ReceptionPasswordFormProps {
  eventId: string
}

export default function ReceptionPasswordForm({
  eventId,
}: ReceptionPasswordFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccessMessage('')

    const res = await fetch(
      `/api/summerjob-events/${eventId}/set-reception-password`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      }
    )
    if (!res.ok) {
      setError('Chyba při nastavení hesla')
    } else {
      setSuccessMessage('Heslo bylo úspěšně změněno')
      setPassword('')
    }

    setLoading(false)
  }
  return (
    <>
      <form
        className="d-flex align-items-center w-100 gap-5 mt-3"
        onSubmit={handleSubmit}
      >
        <input
          type="text"
          className="form-control p-0"
          placeholder="Zadejte nové heslo"
          onChange={e => setPassword(e.target.value)}
          value={password}
          disabled={loading}
        ></input>
        <button
          type="submit"
          className="btn btn-primary flex-shrink-0"
          disabled={loading || !password}
        >
          Nastavit heslo
        </button>
      </form>
      {error && <span className="text-danger">{error}</span>}
      {successMessage && <span className="text-success">{successMessage}</span>}
    </>
  )
}
