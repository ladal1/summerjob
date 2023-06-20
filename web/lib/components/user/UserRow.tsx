'use client'
import { useAPIUserUpdate } from 'lib/fetcher/user'
import { UserComplete } from 'lib/types/user'
import { useState } from 'react'
import ConfirmationModal from '../modal/ConfirmationModal'
import { Modal, ModalSize } from '../modal/Modal'
import { SimpleRow } from '../table/SimpleRow'
import EditUserForm from './EditUserForm'

interface UserRowProps {
  user: UserComplete
  onUpdate: () => void
}

export default function UserRow({ user, onUpdate }: UserRowProps) {
  const { trigger, error } = useAPIUserUpdate(user.id, {
    onSuccess: () => onUpdate(),
  })
  const toggleLocked = () => {
    trigger({ blocked: !user.blocked })
  }

  return <SimpleRow data={formatUserRow(user, toggleLocked, onUpdate)} />
}

function formatUserRow(
  user: UserComplete,
  toggleLocked: () => void,
  onUserEdited: () => void
) {
  const permissions = user.permissions
  const permissionString = permissions.join(', ')
  return [
    `${user.lastName}, ${user.firstName}`,
    user.email,
    permissionString,
    <span
      key={`actions-${user.id}`}
      className="d-flex align-items-center gap-3"
    >
      <EditIcon onEdited={onUserEdited} user={user} />
      <LockIcon locked={user.blocked} onConfirm={toggleLocked} />
    </span>,
  ]
}

function LockIcon({
  locked,
  onConfirm,
}: {
  locked: boolean
  onConfirm: () => void
}) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const onDialogConfirmed = () => {
    setDialogOpen(false)
    onConfirm()
  }
  const onDialogCancelled = () => {
    setDialogOpen(false)
  }
  return (
    <>
      {!locked ? (
        <i
          className="fas fa-lock smj-action-pin cursor-pointer"
          title="Zamknout účet"
          onClick={() => setDialogOpen(true)}
        />
      ) : (
        <i
          className="fas fa-lock-open smj-action-pin cursor-pointer"
          title="Odemknout účet"
          onClick={() => setDialogOpen(true)}
        />
      )}
      {dialogOpen && (
        <ConfirmationModal
          onConfirm={onDialogConfirmed}
          onReject={onDialogCancelled}
        >
          <p>Chcete {locked ? 'odemknout' : 'zamknout'} tento účet?</p>
          {!locked && (
            <>
              <p>
                Uživatel bude odhlášen ze všech zařízení a nebude se moci znovu
                přihlásit do systému, dokud nedojde k odemčení účtu.
              </p>
              <p>
                S uživatelem bude možné dále manipulovat a přiřazovat ho k
                úkolům.
              </p>
            </>
          )}
        </ConfirmationModal>
      )}
    </>
  )
}

function EditIcon({
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
