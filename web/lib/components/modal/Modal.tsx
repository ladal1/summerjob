interface ModalProps {
  children: React.ReactNode
  title: string
  size: ModalSize
  onClose?: () => void
}

export enum ModalSize {
  MEDIUM = '',
  LARGE = 'modal-lg',
}

export function Modal({ children, title, size, onClose }: ModalProps) {
  return (
    <>
      <div className="modal-backdrop fade show"></div>
      <div
        className={`modal fade show ${size}`}
        style={{ display: 'block' }}
        tabIndex={-1}
      >
        <div className="modal-dialog">
          <div className="modal-content rounded-3">
            <div className="modal-header">
              <h5 className="modal-title">{title}</h5>
              {onClose && (
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => onClose()}
                  aria-label="Close"
                ></button>
              )}
            </div>
            <div className="modal-body text-wrap">{children}</div>
          </div>
        </div>
      </div>
    </>
  )
}
