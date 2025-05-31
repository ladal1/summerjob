import ConfirmationModal from './ConfirmationModal'

interface UnsavedChangesModalProps {
  onConfirm: () => void
  onCancel: () => void
}

export default function UnsavedChangesModal({
  onConfirm,
  onCancel,
}: UnsavedChangesModalProps) {
  return (
    <ConfirmationModal onConfirm={onConfirm} onReject={onCancel}>
      <div className="text-center">
        <i className="fas fa-exclamation-triangle text-warning fs-1 mb-3"></i>
        <p className="mb-2">
          <strong>Máte neuložené změny</strong>
        </p>
        <p className="text-muted">
          Pokud opustíte tuto stránku, vaše změny budou ztraceny. Opravdu chcete
          pokračovat?
        </p>
      </div>
    </ConfirmationModal>
  )
}
