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
  const [bulkLocation, setBulkLocation] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [showCreateModal, setShowCreateModal] = useState(false)

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

  const applyBulkLocation = async () => {
    try {
      await apiAdorationUpdateLocationBulk(selectedIds, bulkLocation)
      await mutate()
      setSelectedIds([])
    } catch (e) {
      console.error('Chyba při změně lokace:', e)
    }
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
            <input
              type="text"
              className="form-control form-control-sm"
              placeholder="Zadej lokaci"
              value={bulkLocation}
              onChange={e => setBulkLocation(e.target.value)}
              style={{ maxWidth: '200px' }}
            />
            <button
              className="btn btn-sm btn-outline-primary"
              disabled={selectedIds.length === 0}
              onClick={applyBulkLocation}
            >
              Změnit lokaci vybraným
            </button>
            <button
              className="btn btn-sm btn-outline-danger"
              disabled={selectedIds.length === 0}
              onClick={deleteSelectedSlots}
            >
              Smazat vybrané
            </button>
            <button
              className="btn btn-sm btn-outline-success"
              onClick={() => setShowCreateModal(true)}
            >
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
                          {w.firstName} {w.lastName}
                          {i < slot.workers.length - 1 ? ', ' : ''}
                        </span>
                      ))
                    ) : (
                      <em className="text-muted">nepřihlášen</em>
                    )}
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
    </div>
  )
}
