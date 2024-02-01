import { Modal, ModalSize } from './Modal'
type AddCarModalProps = {
  onClose: () => void
}

export default function AddCarModal({ onClose }: AddCarModalProps) {
  return (
    <Modal title="Přidat auto" size={ModalSize.LARGE} onClose={onClose}>
      <p>Přidáváme autíčko</p>
      <button
        className="btn pt-2 pb-2 btn-primary float-end"
        onClick={() => onClose()}
      >
        Pokračovat
      </button>
    </Modal>
  )
}
