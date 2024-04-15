import { useEffect, useRef } from 'react'

interface ModalProps {
  children: React.ReactNode
  title?: string
  size: ModalSize
  onClose: () => void
}

export enum ModalSize {
  MEDIUM = '',
  LARGE = 'modal-lg',
}

export function Modal({ children, title, size, onClose }: ModalProps) {
  const modalRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      //if we click anywhere outside of modalRef it will close it
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        onClose()
      }
    }

    // if it register mouse click anywhere on the window it will call handleCLickOutside
    document.addEventListener('click', handleClickOutside) // alternatively use window. instead of document.

    // clean up
    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  }, [modalRef, onClose])

  return (
    <>
      <div className="modal-backdrop fade show"></div>
      <div className={`modal fade show ${size} d-block`} tabIndex={-1}>
        <div className="modal-dialog">
          <div className="modal-content rounded-3" ref={modalRef}>
            <div className="modal-header">
              <h4 className="modal-title">{title}</h4>
              <button
                type="button"
                className="btn-close"
                onClick={() => onClose()}
                aria-label="Close"
              />
            </div>
            <div className="modal-body text-wrap">{children}</div>
          </div>
        </div>
      </div>
    </>
  )
}
