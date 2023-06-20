import { Modal, ModalSize } from './Modal'

type ErrorMessageModalProps = {
  onClose: () => void
  mainMessage?: string
  details?: string
}

export default function ErrorMessageModal({
  onClose,
  mainMessage,
  details,
}: ErrorMessageModalProps) {
  return (
    <Modal title="Chyba" size={ModalSize.MEDIUM} onClose={onClose}>
      <p>
        {mainMessage
          ? mainMessage
          : 'Během ukládání nastala chyba. Zkontrolujte připojení k internetu a zkuste to znovu.'}
      </p>
      {details && (
        <div>
          <pre className="text-wrap"> {details}</pre>
        </div>
      )}
      <button
        type="button"
        className="btn pt-2 pb-2 btn-secondary float-end"
        onClick={() => onClose()}
      >
        Zavřít
      </button>
    </Modal>
  )
}
