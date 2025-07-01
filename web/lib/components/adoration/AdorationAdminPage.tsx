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
  canDeleteSlots: boolean
}

export default function AdminAdorationManager({ event, canDeleteSlots }: Props) {
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
  const [showOnlyUnfilled, setShowOnlyUnfilled] = useState(false)

  const {
    data: slots = [],
    isLoading,
    mutate,
  } = useAPIAdorationSlotsAdmin(date, event.id)

  useEffect(() => {
    const params = new URLSearchParams({ date })
    router.replace(`?${params.toString()}`, { scroll: false })
  }, [date, router])

  const toggleSelectAll = () => {
    setSelectedIds(isAllSelected ? [] : sortedSlots.map(slot => slot.id))
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

  // Helper function to get slot status styling
  const getSlotStatusInfo = (slot: FrontendAdorationSlot) => {
    const { workerCount, capacity } = slot
    
    if (workerCount === 0) {
      return {
        badgeClass: 'bg-danger',
        badgeText: 'Prázdný',
        icon: 'fas fa-exclamation-triangle',
        rowClass: 'table-danger'
      }
    } else if (workerCount < capacity) {
      return {
        badgeClass: 'bg-warning text-dark',
        badgeText: 'Částečně obsazen',
        icon: 'fas fa-clock',
        rowClass: 'table-warning'
      }
    } else if (workerCount === capacity) {
      return {
        badgeClass: 'bg-success',
        badgeText: 'Obsazen',
        icon: 'fas fa-check-circle',
        rowClass: ''
      }
    } else {
      return {
        badgeClass: 'bg-dark',
        badgeText: 'Přeplněn',
        icon: 'fas fa-exclamation-circle',
        rowClass: ''
      }
    }
  }

  // Filter slots but keep original time order
  const sortedSlots = [...slots]
    .filter(slot => showOnlyUnfilled ? slot.workerCount < slot.capacity : true)
    .sort((a, b) => a.localDateStart.getTime() - b.localDateStart.getTime())

  // Statistics for the current day (from all slots, not filtered)
  const emptySlots = slots.filter(s => s.workerCount === 0).length
  const partiallyFilledSlots = slots.filter(s => s.workerCount > 0 && s.workerCount < s.capacity).length
  const fullSlots = slots.filter(s => s.workerCount === s.capacity).length

  // Get unfilled slots for the bubble indicator
  const unfilledSlots = slots.filter(s => s.workerCount < s.capacity).sort((a, b) => a.localDateStart.getTime() - b.localDateStart.getTime())

  const isAllSelected =
    sortedSlots.length > 0 && sortedSlots.every(slot => selectedIds.includes(slot.id))

  return (
    <div className="container mt-2">
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <h4 className="mb-0">Adorace – administrace</h4>
        <div className="d-flex gap-2 align-items-center">
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
          {/* Filter Controls */}
          <div className="row mb-3">
            <div className="col-12">
              <div className="form-check form-switch">
                <input 
                  className="form-check-input" 
                  type="checkbox" 
                  id="showOnlyUnfilled"
                  checked={showOnlyUnfilled}
                  onChange={(e) => setShowOnlyUnfilled(e.target.checked)}
                />
                <label className="form-check-label" htmlFor="showOnlyUnfilled">
                  <i className="fas fa-filter me-1"></i>
                  Zobrazit pouze neobsazené sloty
                  {showOnlyUnfilled && (
                    <span className="badge bg-primary ms-2">
                      {sortedSlots.length} z {slots.length}
                    </span>
                  )}
                </label>
              </div>
            </div>
          </div>

          {/* Statistics Section */}
          <div className="row mb-3">
            <div className="col-12">
              <div className="d-flex gap-3 align-items-center flex-wrap">
                <div className="d-flex align-items-center">
                  <span className="badge bg-danger me-2">{emptySlots}</span>
                  <small className="text-muted">Prázdné sloty</small>
                </div>
                <div className="d-flex align-items-center">
                  <span className="badge bg-warning text-dark me-2">{partiallyFilledSlots}</span>
                  <small className="text-muted">Částečně obsazené</small>
                </div>
                <div className="d-flex align-items-center">
                  <span className="badge bg-success me-2">{fullSlots}</span>
                  <small className="text-muted">Plně obsazené</small>
                </div>
                {unfilledSlots.length > 0 && (
                  <div className="d-flex align-items-center ms-auto">
                    <div className="badge bg-info text-white me-2">
                      <i className="fas fa-clock me-1"></i>
                      Volné sloty: {unfilledSlots.map((slot, index) => (
                        <span key={slot.id}>
                          {format(slot.localDateStart, 'HH:mm')}
                          {index < unfilledSlots.length - 1 ? ', ' : ''}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="d-flex gap-2 align-items-center mb-3">
            <button
              className="btn btn-sm btn-outline-primary"
              disabled={selectedIds.length === 0}
              onClick={() => setShowBulkLocationModal(true)}
            >
              <i className="fas fa-map-marker-alt me-1"></i>
              Změnit lokaci vybraným ({selectedIds.length})
            </button>
            {canDeleteSlots && (
              <button
                className="btn btn-sm btn-outline-danger"
                disabled={selectedIds.length === 0}
                onClick={deleteSelectedSlots}
              >
                <i className="fas fa-trash me-1"></i>
                Smazat vybrané ({selectedIds.length})
              </button>
            )}
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
            <thead className="table-primary">
              <tr>
                <th style={{ width: '40px' }}>
                  <input
                    type="checkbox"
                    className="form-check-input"
                    checked={isAllSelected}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th style={{ width: '120px' }} className="text-center d-none d-md-table-cell">Čas</th>
                <th style={{ width: '80px' }} className="text-center d-md-none">Čas</th>
                <th>Lokace</th>
                <th>Pracanti</th>
                <th style={{ width: '120px' }} className="d-none d-md-table-cell">Akce</th>
                <th style={{ width: '60px' }} className="d-md-none">Akce</th>
              </tr>
            </thead>
            <tbody>
              {sortedSlots.map(slot => {
                const endTime = new Date(slot.localDateStart.getTime() + slot.length * 60000)
                const startTimeStr = format(slot.localDateStart, 'HH:mm')
                const endTimeStr = format(endTime, 'HH:mm')
                const statusInfo = getSlotStatusInfo(slot)
                
                return (
                  <tr key={slot.id} className={statusInfo.rowClass}>
                    <td className="align-middle">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        checked={selectedIds.includes(slot.id)}
                        onChange={() => toggleSelectOne(slot.id)}
                      />
                    </td>
                    <td className="text-center align-middle d-none d-md-table-cell">
                      <strong>{startTimeStr} - {endTimeStr}</strong>
                      <br />
                      <small className="text-muted">{slot.length} min</small>
                    </td>
                    <td className="text-center align-middle d-md-none" style={{ width: '80px' }}>
                      <strong>{startTimeStr}<br/>-<br/>{endTimeStr}</strong>
                      <br />
                      <small className="text-muted">{slot.length}min</small>
                    </td>
                    <td className="align-middle">{slot.location}</td>
                    <td className="align-middle">
                      <div className="d-flex align-items-center gap-2 flex-wrap">
                        <span className={`badge ${statusInfo.badgeClass}`}>
                          <i className={`${statusInfo.icon} me-1`}></i>
                          {slot.workerCount}/{slot.capacity}
                        </span>
                        <small className={`badge ${statusInfo.badgeClass} opacity-75`}>
                          {statusInfo.badgeText}
                        </small>
                      </div>
                      {slot.workers.length > 0 && (
                        <div className="mt-1">
                          <small className="text-muted me-2">Přiřazení:</small>
                          {slot.workers.map((w, index) => (
                            <span key={index} className="badge bg-light text-dark me-1 mb-1 d-inline-block" style={{ fontSize: '0.75rem' }}>
                              {w.firstName} {w.lastName} ({w.phone})
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="align-middle">
                      <div className="d-flex gap-1 d-none d-md-flex">
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
                      <div className="d-flex flex-column gap-2 d-md-none">
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
                  </tr>
                )
              })}
            </tbody>
          </table>
        </>
      )}
      {showCreateModal && (
        <AdminCreateAdorationModal
          eventId={event.id}
          eventStart={event.startDate}
          eventEnd={event.endDate}
          selectedDate={date}
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
