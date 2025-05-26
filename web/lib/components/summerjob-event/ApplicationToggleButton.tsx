'use client'

import { useState } from 'react'

interface ApplicationToggleButtonProps {
  eventId: string
  initialValue: boolean
}

export default function ApplicationToggleButton({
  eventId,
  initialValue,
}: ApplicationToggleButtonProps) {
  const [isOpen, setIsOpen] = useState(initialValue)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const toggleApplication = async () => {
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const res = await fetch(
        `/api/summerjob-events/${eventId}/toggle-application`,
        {
          method: 'POST',
        }
      )

      if (!res.ok) {
        throw new Error('Nepodařilo se změnit stav přihlašování')
      }

      const data = await res.json()
      setIsOpen(data.isApplicationOpen)
      setSuccess(true)
    } catch (err) {
      console.error('Chyba: ', err)
    } finally {
      setLoading(false)
      setTimeout(() => setSuccess(false), 2000)
    }
  }

  return (
    <div className="mb-3">
      <p>
        Přihlašování je nyní:{' '}
        <strong className={isOpen ? 'text-success' : 'text-danger'}>
          {isOpen ? 'otevřené' : 'uzavřené'}
        </strong>
      </p>
      <button
        className={`btn ${isOpen ? 'btn-danger' : 'btn-success'}`}
        onClick={toggleApplication}
        disabled={loading}
      >
        {loading
          ? 'Probíhá změna...'
          : isOpen
          ? 'Vypnout přihlašování'
          : 'Spustit přihlašování'}
      </button>

      {error && <p className="text-danger mt-2">{error}</p>}
      {success && <p className="text-success mt-2">Stav změněn</p>}
    </div>
  )
}
