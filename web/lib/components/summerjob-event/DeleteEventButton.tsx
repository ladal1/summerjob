import { useAPISummerJobEventDelete } from 'lib/fetcher/summerjob-event'
import { SummerJobEventComplete } from 'lib/types/summerjob-event'
import { useState } from 'react'
import ConfirmationModal from '../modal/ConfirmationModal'
import ErrorMessageModal from '../modal/ErrorMessageModal'

interface DeleteEventButtonProps {
  smjEvent: SummerJobEventComplete
  onSuccess: () => void
}

export default function DeleteEventButton({
  smjEvent,
  onSuccess,
}: DeleteEventButtonProps) {
  const { trigger, error, isMutating, reset } = useAPISummerJobEventDelete(
    smjEvent.id,
    {
      onSuccess: () => {
        setShowDeleteConfirmation(false)
        onSuccess()
      },
    }
  )

  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)
  const hideError = () => {
    reset()
    setShowDeleteConfirmation(false)
  }
  const confirmDelete = () => {
    setShowDeleteConfirmation(true)
  }
  const deleteEvent = () => {
    trigger()
  }

  return (
    <>
      <button
        className="btn btn-outline-danger pt-2 pb-2 align-self-start"
        type="button"
        onClick={confirmDelete}
      >
        <i className="fas fa-trash-alt me-2"></i>
        <span>Odstranit</span>
      </button>

      {showDeleteConfirmation && !error && (
        <ConfirmationModal
          onConfirm={deleteEvent}
          onReject={() => setShowDeleteConfirmation(false)}
        >
          <p>Opravdu chcete smazat tento ročník?</p>
          {smjEvent.plans.length > 0 && (
            <div className="alert alert-danger">
              Tento ročník obsahuje plány! Jeho odstraněním zároveň odstraníte
              všechny související záznamy (plány, joby, jízdy...).
            </div>
          )}
        </ConfirmationModal>
      )}
      {error && (
        <ErrorMessageModal
          mainMessage="Nastala chyba. Zkuste to později."
          details={error.message}
          onClose={hideError}
        />
      )}
    </>
  )
}
