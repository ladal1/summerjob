import { useState } from 'react'
import ConfirmationModal from '../modal/ConfirmationModal'

export function LockIcon({
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
      <i
        className={`fas ${
          locked ? 'fa-lock-open' : 'fa-lock'
        } smj-action-pin cursor-pointer`}
        title={`${locked ? 'Odemknout účet' : 'Zamknout účet'}`}
        onClick={() => setDialogOpen(true)}
      />
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
