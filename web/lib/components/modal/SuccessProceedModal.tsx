import { Modal, ModalSize } from './Modal'
type SuccessProceedModalProps = {
  onClose: () => void
}

export default function SuccessProceedModal({
  onClose,
}: SuccessProceedModalProps) {
  return (
    <Modal title="Úspěch" size={ModalSize.MEDIUM} onClose={onClose}>
      <p>Změny byly úspěšně uloženy.</p>
      <button
        className="btn pt-2 pb-2 btn-primary float-end"
        onClick={() => onClose()}
      >
        Pokračovat
      </button>
    </Modal>
  )
}
