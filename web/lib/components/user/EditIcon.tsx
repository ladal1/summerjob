import { UserComplete } from 'lib/types/user'
import { useState } from 'react'
import { Modal, ModalSize } from '../modal/Modal'
import EditUserForm from './EditUserForm'

export function EditIcon({
  user,
  onEdited,
}: {
  user: UserComplete
  onEdited: () => void
}) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const onDialogConfirmed = () => {
    setDialogOpen(false)
    onEdited()
  }
  const onDialogCancelled = () => {
    setDialogOpen(false)
  }
  return (
    <>
      <i
        className="fas fa-edit smj-action-edit cursor-pointer"
        title="Upravit role"
        onClick={() => setDialogOpen(true)}
      />

      {dialogOpen && (
        <Modal
          size={ModalSize.MEDIUM}
          title="Upravit role"
          onClose={onDialogCancelled}
        >
          <EditUserForm onUpdate={onDialogConfirmed} user={user} />
        </Modal>
      )}
    </>
  )
}
