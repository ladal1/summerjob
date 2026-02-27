'use client'

import { useState } from 'react'
import { Label } from '../forms/Label'
import ConfirmationModal from '../modal/ConfirmationModal'

export default function SendPushNotificationForm() {
  const [value, setValue] = useState('')
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')

  const handleSubmit = async () => {
    setLoading(true)
    setError(false)
    setStatusMessage('')
    setShowConfirmModal(false)

    try {
      const res = await fetch('/api/push-subscription/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payload: value }),
      })

      if (!res.ok) {
        throw new Error()
      }
    } catch {
      setError(true)
      setStatusMessage('Nepodařilo se odeslat oznámení')
    } finally {
      setLoading(false)
    }

    setStatusMessage('Oznámení úspěšně odesláno')
    setValue('')
  }
  return (
    <div>
      <Label id="notification-broadcast-input" label="Text notifikace"></Label>
      <div className="d-flex flex-row gap-3">
        <input
          id="notification-broadcast-input"
          type="text"
          className="form-control pb-0"
          placeholder="Zadejte text hromadné notifikace..."
          autoComplete="off"
          value={value}
          onChange={e => setValue(e.target.value)}
        />

        <button
          type="button"
          className="btn btn-primary text-nowrap"
          disabled={value.trim() === '' || loading}
          onClick={() => setShowConfirmModal(true)}
        >
          {loading ? 'Posílání...' : 'Poslat oznámení'}
        </button>
      </div>

      <div className="d-flex justify-content-between align-items-center mt-2">
        <div style={{ minHeight: '1.25rem' }}>
          {statusMessage && (
            <span
              className={error ? 'text-danger small' : 'text-success small'}
            >
              {statusMessage}
            </span>
          )}
        </div>
      </div>

      {showConfirmModal && (
        <ConfirmationModal
          onConfirm={handleSubmit}
          onReject={() => setShowConfirmModal(false)}
        >
          Chystáte se odeslat oznámení všem účastníkům akce.
        </ConfirmationModal>
      )}
    </div>
  )
}
