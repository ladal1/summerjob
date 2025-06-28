'use client'

import { useState, useRef, useEffect } from 'react'
import { format } from 'date-fns'
import { useForm } from 'react-hook-form'
import { useAPIWorkers } from 'lib/fetcher/worker'
import { apiAdorationAssignWorker, apiAdorationUnassignWorker } from 'lib/fetcher/adoration'
import { FilterSelectInput } from 'lib/components/forms/input/FilterSelectInput'
import type { FrontendAdorationSlot } from 'lib/types/adoration'
import type { FilterSelectItem } from 'lib/components/filter-select/FilterSelect'

interface Props {
  slot: FrontendAdorationSlot
  onClose: () => void
  onAssigned: () => void
}

export default function AdorationWorkerAssignModal({
  slot,
  onClose,
  onAssigned,
}: Props) {
  const [loading, setLoading] = useState(false)
  const backdropRef = useRef<HTMLDivElement>(null)

  const { data: workers = [], isLoading: workersLoading } = useAPIWorkers()

  const {
    formState: { errors },
  } = useForm({
    defaultValues: {
      workerId: '',
    },
  })

  // Filter out workers already assigned to this slot
  const availableWorkers = workers.filter(worker => 
    !slot.workers.some(assigned => 
      assigned.firstName === worker.firstName && assigned.lastName === worker.lastName
    )
  )

  // Convert workers to FilterSelectItem format
  const workerItems: FilterSelectItem[] = availableWorkers.map(worker => ({
    id: worker.id,
    searchable: `${worker.firstName} ${worker.lastName} ${worker.email}`,
    name: `${worker.firstName} ${worker.lastName}`,
    description: worker.email,
  }))

  const [selectedWorkerId, setSelectedWorkerId] = useState('')

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

  const handleAssign = async () => {
    if (!selectedWorkerId) {
      alert('Vyberte pracanta pro přiřazení.')
      return
    }

    setLoading(true)
    try {
      await apiAdorationAssignWorker(slot.id, selectedWorkerId)
      onAssigned()
      onClose()
    } catch (err) {
      alert('Chyba: ' + (err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveWorker = async (workerFirstName: string, workerLastName: string) => {
    const worker = workers.find(w => w.firstName === workerFirstName && w.lastName === workerLastName)
    if (!worker) {
      alert('Pracant nenalezen.')
      return
    }

    setLoading(true)
    try {
      await apiAdorationUnassignWorker(slot.id, worker.id)
      onAssigned() // This will refresh the slot data in the parent component
      onClose() // Close modal after successful removal
    } catch (err) {
      alert('Chyba: ' + (err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 d-flex justify-content-center align-items-start pt-5 px-3"
      style={{ zIndex: 1050 }}
      ref={backdropRef}
    >
      <div className="bg-white rounded shadow-lg p-4" style={{ width: '600px' }}>
        <div className="d-flex justify-content-between align-items-start mb-3">
          <h5 className="mb-0">Přiřadit pracanta na adoraci</h5>
          <button type="button" className="btn-close" onClick={onClose}></button>
        </div>

        <div className="mb-3">
          <h6>Slot info:</h6>
          <p className="mb-1">
            <strong>Čas:</strong> {format(slot.localDateStart, 'HH:mm')} ({slot.length} min)
          </p>
          <p className="mb-1">
            <strong>Lokace:</strong> {slot.location}
          </p>
          <p className="mb-1">
            <strong>Obsazenost:</strong> {slot.workerCount} / {slot.capacity}
          </p>
        </div>

        {slot.workers.length > 0 && (
          <div className="mb-3">
            <h6>Aktuálně přiřazení pracanti:</h6>
            <ul className="list-group">
              {slot.workers.map((worker, index) => (
                <li key={index} className="list-group-item d-flex justify-content-between align-items-center">
                  <span>{worker.firstName} {worker.lastName}</span>
                  <button
                    className="btn btn-sm btn-outline-danger"
                    disabled={loading}
                    onClick={() => handleRemoveWorker(worker.firstName, worker.lastName)}
                  >
                    Odebrat
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {slot.workerCount < slot.capacity && (
          <div className="mb-3">
            <h6>Přiřadit nového pracanta:</h6>
            {workersLoading ? (
              <p>Načítání pracantů...</p>
            ) : (
              <div className="row g-2 align-items-end">
                <div className="col-8">
                  <div className="position-relative">
                    <FilterSelectInput
                      id="workerId"
                      label=""
                      placeholder="Vyberte pracanta..."
                      items={workerItems}
                      errors={errors}
                      onSelected={(workerId) => setSelectedWorkerId(workerId)}
                    />
                    {/* Fix for modal styling conflicts */}
                    <style jsx>{`
                      :global(.smj-dropdown) {
                        background-color: white !important;
                        border: 1px solid #ced4da !important;
                        border-radius: 0.375rem !important;
                        padding: 0.375rem 0.75rem !important;
                        width: 100% !important;
                        box-sizing: border-box !important;
                      }
                      :global(.smj-dropdown:focus) {
                        border-color: #86b7fe !important;
                        box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25) !important;
                        outline: none !important;
                      }
                      :global(.smj-dropdown-menu) {
                        background-color: white !important;
                        border: 1px solid #ced4da !important;
                        border-radius: 0.375rem !important;
                        max-height: 200px !important;
                        overflow-y: auto !important;
                      }
                    `}</style>
                  </div>
                </div>
                <div className="col-4">
                  <button
                    className="btn btn-primary w-100"
                    disabled={loading || !selectedWorkerId}
                    onClick={handleAssign}
                  >
                    {loading ? 'Přiřazuji...' : 'Přiřadit'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {slot.workerCount >= slot.capacity && (
          <div className="alert alert-warning" role="alert">
            Tento slot je již plně obsazen.
          </div>
        )}

        <div className="mt-4 d-flex justify-content-end">
          <button className="btn btn-secondary" onClick={onClose}>
            Zavřít
          </button>
        </div>
      </div>
    </div>
  )
}
