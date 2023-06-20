import { useState } from 'react'
import ConfirmationModal from '../modal/ConfirmationModal'

interface DeleteIconProps {
  onClick: () => void
  isBeingDeleted: boolean
  showConfirmation?: boolean
  getConfirmationMessage?: () => React.ReactNode
}

export default function DeleteIcon({
  onClick,
  isBeingDeleted,
  showConfirmation = false,
  getConfirmationMessage = () => 'Opravdu chcete smazat položku?',
}: DeleteIconProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const onDialogConfirmed = () => {
    setDialogOpen(false)
    onClick()
  }
  const onDialogCancelled = () => {
    setDialogOpen(false)
  }
  const onIconClicked = () => {
    if (showConfirmation) {
      setDialogOpen(true)
    } else {
      onClick()
    }
  }
  return (
    <>
      {!isBeingDeleted && (
        <>
          <i
            className="fas fa-trash-alt smj-action-delete cursor-pointer"
            title="Odstranit"
            onClick={e => {
              e.stopPropagation()
              onIconClicked()
            }}
          ></i>
          <span style={{ width: '0px' }}></span>
        </>
      )}
      {isBeingDeleted && (
        <i
          className="fas fa-spinner smj-action-delete spinning"
          title="Odstraňování..."
        ></i>
      )}
      {dialogOpen && (
        <ConfirmationModal
          onConfirm={onDialogConfirmed}
          onReject={onDialogCancelled}
        >
          {getConfirmationMessage()}
        </ConfirmationModal>
      )}
    </>
  )
}
