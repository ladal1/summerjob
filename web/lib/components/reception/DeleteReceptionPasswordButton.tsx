'use client'

import ConfirmationModal from '../modal/ConfirmationModal'
import { useState } from 'react'

interface DeleteReceptionPasswordButtonProps {
  eventId: string
}

export default function DeleteReceptionPasswordButton({
  eventId,
}: DeleteReceptionPasswordButtonProps) {
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const confirmDelete = () => {
    setShowDeleteConfirmation(true)
  }

  const handleDelete = async () => {
    setLoading(true)
    setShowDeleteConfirmation(false)
    setSuccessMessage('')
    setError('')

    const res = await fetch(
      `/api/summerjob-events/${eventId}/set-reception-password`,
      {
        method: 'DELETE',
      }
    )
    if (!res.ok) {
      setError('Chyba při mazání hesla')
    } else {
      setSuccessMessage('Heslo bylo úspěšně smazáno')
    }

    setLoading(false)
  }
  return (
    <div className="d-flex flex-column align-items-end gap-2">
      <button
        className="btn btn-outline-danger text-nowrap"
        type="button"
        onClick={confirmDelete}
        disabled={loading}
      >
        <i className="fas fa-trash-alt me-2"></i>
        <span>Odstranit heslo</span>
      </button>
      {error && <span className="text-danger">{error}</span>}
      {successMessage && <span className="text-success">{successMessage}</span>}

      {showDeleteConfirmation && (
        <ConfirmationModal
          onConfirm={handleDelete}
          onReject={() => setShowDeleteConfirmation(false)}
        >
          <p>Opravdu chcete smazat heslo pro recepci?</p>
          <div className="alert alert-danger">
            Smazáním hesla dojde k odhlášení recepce a k nemožnosti přihlášení
            na recepci dokud se heslo znovu nenastaví.
          </div>
        </ConfirmationModal>
      )}
    </div>
  )
}
