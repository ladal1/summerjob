import { useAPISummerJobEventSetActive } from 'lib/fetcher/summerjob-event'
import { SummerJobEvent } from 'lib/prisma/client'
import { useState } from 'react'
import ConfirmationModal from '../modal/ConfirmationModal'

interface SetEventActiveButtonProps {
  smjEvent: SummerJobEvent
  onSuccess: () => void
}

export default function SetEventActiveButton({
  smjEvent,
  onSuccess,
}: SetEventActiveButtonProps) {
  const { trigger, error, isMutating } = useAPISummerJobEventSetActive(
    smjEvent.id,
    {
      onSuccess: () => {
        setIsSetActiveEventModalOpen(false)
        onSuccess()
      },
    }
  )
  const triggerSetActive = () => {
    trigger({ isActive: true })
  }

  const [isSetActiveEventModalOpen, setIsSetActiveEventModalOpen] =
    useState(false)
  return (
    <>
      {smjEvent.isActive && (
        <button
          className="btn btn-light pt-2 pb-2 align-self-start"
          disabled={true}
        >
          <i className="fas fa-check me-2"></i>
          Aktivní
        </button>
      )}
      {!smjEvent.isActive && (
        <button
          className="btn btn-primary pt-2 pb-2 align-self-start"
          onClick={() => setIsSetActiveEventModalOpen(true)}
        >
          <i className="far fa-clock me-2"></i>
          Nastavit jako aktivní
        </button>
      )}
      {isSetActiveEventModalOpen && (
        <ConfirmationModal
          onConfirm={triggerSetActive}
          onReject={() => setIsSetActiveEventModalOpen(false)}
        >
          <p>
            Změnou aktivního ročníku dojde k odhlášení ostatních uživatelů.
            Pouze uživatelé s administrátorským přístupem budou mít možnost se
            přihlásit. Nastavit ročník <b>{smjEvent.name}</b> jako aktivní?
          </p>
          <small className="text-muted">
            Pokud se po přenastavení aktivního ročníku zobrazují staré údaje,
            obnovte stránku.
          </small>
        </ConfirmationModal>
      )}
    </>
  )
}
