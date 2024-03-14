import { Modal, ModalSize } from './Modal'
type CallSMJTeamModalProps = {
  onClose: () => void
  additionalText: string
}

export default function CallSMJTeamModal({
  onClose,
  additionalText,
}: CallSMJTeamModalProps) {
  return (
    <Modal title="Momentálně nedostupné" size={ModalSize.MEDIUM} onClose={onClose}>
      <p>{additionalText}</p>
      <span className="text-muted">Pro více informací volejte prosím týmu SummerJob.</span>
    </Modal>
  )
}
