'use client'

import { useState, useRef, useEffect } from 'react'
import { useForm } from 'react-hook-form'

interface Props {
  selectedCount: number
  onClose: () => void
  onApply: (location: string) => void
}

interface LocationFormData {
  location: string
}

export default function AdorationBulkLocationModal({
  selectedCount,
  onClose,
  onApply,
}: Props) {
  const [loading, setLoading] = useState(false)
  const backdropRef = useRef<HTMLDivElement>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LocationFormData>({
    defaultValues: {
      location: '',
    },
  })

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (backdropRef.current && event.target === backdropRef.current) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [onClose])

  const onSubmit = async (data: LocationFormData) => {
    if (!data.location.trim()) {
      return
    }

    setLoading(true)
    try {
      await onApply(data.location.trim())
      onClose()
    } catch (err) {
      alert('Chyba: ' + (err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 d-flex justify-content-center align-items-center px-3"
      style={{ zIndex: 1050 }}
      ref={backdropRef}
    >
      <div className="bg-white rounded shadow-lg p-4" style={{ width: '500px' }}>
        <div className="d-flex justify-content-between align-items-start mb-3">
          <h5 className="mb-0">Změnit lokaci slotů</h5>
          <button type="button" className="btn-close" onClick={onClose}></button>
        </div>

        <div className="alert alert-info mb-3">
          <i className="fas fa-info-circle me-2"></i>
          Změníte lokaci pro <strong>{selectedCount}</strong> vybraných slotů.
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="mb-3">
            <label htmlFor="location" className="form-label">Nová lokace</label>
            <input
              type="text"
              className={`form-control ${errors.location ? 'is-invalid' : ''}`}
              id="location"
              placeholder="Např. Kaple 1, Kostol sv. Petra..."
              {...register('location', { 
                required: 'Lokace je povinná',
                minLength: { value: 1, message: 'Lokace nesmí být prázdná' }
              })}
            />
            {errors.location && (
              <div className="invalid-feedback">{errors.location.message}</div>
            )}
            <div className="form-text">
              Zadejte název místa, kde se budou adorace konat
            </div>
          </div>

          <div className="d-flex justify-content-end gap-2">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Zrušit
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Aplikuji...' : 'Změnit lokaci'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
