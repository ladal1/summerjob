'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { format, parseISO } from 'date-fns'
import {
  apiAdorationDeleteBulk,
  apiAdorationUpdateLocationBulk,
  useAPIAdorationSlotsAdmin
} from 'lib/fetcher/adoration'
import AdminCreateAdorationModal from './AdorationAdminCreateModal'
import AdorationWorkerAssignModal from './AdorationWorkerAssignModal'
import AdorationEditModal from './AdorationEditModal'
import AdorationBulkLocationModal from './AdorationBulkLocationModal'
import type { FrontendAdorationSlot } from 'lib/types/adoration'

interface Props {
  event: {
    id: string
    startDate: string
    endDate: string
  }
}

export default function AdminAdorationManager({ event }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [date, setDate] = useState(() => {
    const param = searchParams?.get('date')
    const today = new Date().toISOString().slice(0, 10)

    if (param) {
      return param
    }

    return today < event.startDate ? event.startDate : today
  })
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showBulkLocationModal, setShowBulkLocationModal] = useState(false)
  const [selectedSlotForAssignment, setSelectedSlotForAssignment] = useState<FrontendAdorationSlot | null>(null)
  const [selectedSlotForEdit, setSelectedSlotForEdit] = useState<FrontendAdorationSlot | null>(null)

  const {
    data: slots = [],
    isLoading,
    mutate,
  } = useAPIAdorationSlotsAdmin(date, event.id)

  const isAllSelected =
    slots.length > 0 && slots.every(slot => selectedIds.includes(slot.id))

  useEffect(() => {
    const params = new URLSearchParams({ date })
    router.replace(`?${params.toString()}`, { scroll: false })
  }, [date, router])

  const toggleSelectAll = () => {
    setSelectedIds(isAllSelected ? [] : slots.map(slot => slot.id))
  }

  const toggleSelectOne = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const deleteSelectedSlots = async () => {
    try {
      await apiAdorationDeleteBulk(selectedIds)
      await mutate()
      setSelectedIds([])
    } catch (e) {
      console.error('Chyba při mazání slotů:', e)
    }
  }

  const applyBulkLocation = async (location: string) => {
    try {
      await apiAdorationUpdateLocationBulk(selectedIds, location)
      await mutate()
      setSelectedIds([])
    } catch (e) {
      console.error('Chyba při změně lokace:', e)
      throw e
    }
  }

  const openAssignModal = (slot: FrontendAdorationSlot) => {
    setSelectedSlotForAssignment(slot)
    setShowAssignModal(true)
  }

  const closeAssignModal = () => {
    setShowAssignModal(false)
    setSelectedSlotForAssignment(null)
  }

  const openEditModal = (slot: FrontendAdorationSlot) => {
    setSelectedSlotForEdit(slot)
    setShowEditModal(true)
  }

  const closeEditModal = () => {
    setShowEditModal(false)
    setSelectedSlotForEdit(null)
  }

  const getDatesBetween = (start: string, end: string) => {
    const dates = []
    const current = new Date(start)
    const last = new Date(end)

    while (current <= last) {
      dates.push(current.toISOString().slice(0, 10))
      current.setDate(current.getDate() + 1)
    }

    return dates
  }

  const dates = getDatesBetween(event.startDate, event.endDate)

  return (
    <div className="container mt-2">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="mb-0">Adorace – administrace</h4>
        <select
          className="form-select form-select-sm"
          value={date}
          onChange={e => setDate(e.target.value)}
          style={{ width: '220px' }}
        >
          {dates.map(d => (
            <option key={d} value={d}>
              {format(parseISO(d), 'd. M. yyyy')}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <p>Načítání slotů…</p>
      ) : slots.length === 0 ? (
        <>
          <p className="text-secondary">Žádné sloty pro tento den.</p>
          <button
            className="btn btn-sm btn-outline-success"
            onClick={() => setShowCreateModal(true)}
          >
            Vytvořit sloty
          </button>
        </>
      ) : (
        <>
          <div className="d-flex gap-2 align-items-center mb-3">
            <button
              className="btn btn-sm btn-outline-primary"
              disabled={selectedIds.length === 0}
              onClick={() => setShowBulkLocationModal(true)}
            >
              <i className="fas fa-map-marker-alt me-1"></i>
              Změnit lokaci vybraným ({selectedIds.length})
            </button>
            <button
              className="btn btn-sm btn-outline-danger"
              disabled={selectedIds.length === 0}
              onClick={deleteSelectedSlots}
            >
              <i className="fas fa-trash me-1"></i>
              Smazat vybrané ({selectedIds.length})
            </button>
            <button
              className="btn btn-sm btn-outline-success"
              onClick={() => setShowCreateModal(true)}
            >
              <i className="fas fa-plus me-1"></i>
              Vytvořit sloty
            </button>
          </div>

          <div className="form-check mb-2">
            <input
              type="checkbox"
              className="form-check-input"
              id="selectAllCheckbox"
              checked={isAllSelected}
              onChange={toggleSelectAll}
            />
            <label className="form-check-label" htmlFor="selectAllCheckbox">
              Vybrat všechny sloty
            </label>
          </div>

          <table className="table table-bordered table-sm mt-3">
            <thead className="table-light">
              <tr>
                <th style={{ width: '40px' }}>
                  <input
                    type="checkbox"
                    className="form-check-input"
                    checked={isAllSelected}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th style={{ width: '100px' }}>Čas</th>
                <th>Lokace</th>
                <th>Pracanti</th>
                <th>Obsazenost</th>
                <th>Délka</th>
                <th>Akce</th>
              </tr>
            </thead>
            <tbody>
              {slots.map(slot => (
                <tr key={slot.id}>
                  <td>
                    <input
                      type="checkbox"
                      className="form-check-input"
                      checked={selectedIds.includes(slot.id)}
                      onChange={() => toggleSelectOne(slot.id)}
                    />
                  </td>
                  <td>
                    <strong>{format(slot.localDateStart, 'HH:mm')}</strong>
                  </td>
                  <td>{slot.location}</td>
                  <td>
                    {slot.workers.length > 0 ? (
                      slot.workers.map((w, i) => (
                        <span key={i}>
                          {w.firstName} {w.lastName} ({w.phone})
                          {i < slot.workers.length - 1 ? ', ' : ''}
                        </span>
                      ))
                    ) : (
                      <em className="text-muted">nepřihlášen</em>
                    )}
                  </td>
                  <td>{`${slot.workerCount} / ${slot.capacity}`}</td>
                  <td>{slot.length} min</td>
                  <td>
                    <div className="d-flex gap-1">
                      <button
                        className="btn btn-sm btn-outline-dark"
                        onClick={() => openEditModal(slot)}
                        title="Upravit slot"
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      <button
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => openAssignModal(slot)}
                        title="Přiřadit/odebrat pracanta"
                      >
                        <i className="fas fa-user-plus"></i>
                      </button>
                    </div>
                  </td>
                  <td>{`${slot.workerCount} / ${slot.capacity}`}</td>
                  <td>{slot.length} min</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
      {showCreateModal && (
        <AdminCreateAdorationModal
          eventId={event.id}
          eventStart={event.startDate}
          eventEnd={event.endDate}
          onClose={() => setShowCreateModal(false)}
          onCreated={newDate => {
            setDate(newDate)
            mutate()
          }}
        />
      )}
      {showAssignModal && selectedSlotForAssignment && (
        <AdorationWorkerAssignModal
          slot={selectedSlotForAssignment}
          onClose={closeAssignModal}
          onAssigned={() => {
            mutate() // Refresh the slots data
          }}
        />
      )}
      {showEditModal && selectedSlotForEdit && (
        <AdorationEditModal
          slot={selectedSlotForEdit}
          onClose={closeEditModal}
          onUpdated={() => {
            mutate() // Refresh the slots data
          }}
        />
      )}
      {showBulkLocationModal && (
        <AdorationBulkLocationModal
          selectedCount={selectedIds.length}
          onClose={() => setShowBulkLocationModal(false)}
          onApply={applyBulkLocation}
        />
      )}
    </div>
  )
}
