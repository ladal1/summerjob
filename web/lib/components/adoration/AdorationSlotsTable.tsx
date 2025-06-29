'use client'

import { format } from 'date-fns'
import {
  useAPIAdorationSlotsUser,
  apiAdorationSignup,
} from 'lib/fetcher/adoration'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

interface Props {
  eventId: string
  eventStart: string
  eventEnd: string
}

export default function AdorationSlotsTable({
  eventId,
  eventStart,
  eventEnd,
}: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [selectedDate, setSelectedDate] = useState<string | null>(() => {
    return searchParams?.get('date') || null
  })

  const {
    data: allSlots = [],
    isLoading,
    mutate,
  } = useAPIAdorationSlotsUser(selectedDate, eventId)
  
  // Filter out full slots, but keep those where the user is signed up
  const slots = allSlots.filter(slot => slot.workerCount < slot.capacity || slot.isUserSignedUp)
  const [signuping, setSignuping] = useState<string | null>(null)

  // When data loads and we have no explicit date, set the date based on the first slot
  useEffect(() => {
    if (!selectedDate && slots.length > 0) {
      const firstSlotDate = slots[0].localDateStart.toISOString().slice(0, 10)
      setSelectedDate(firstSlotDate)
    }
  }, [selectedDate, slots])

  useEffect(() => {
    if (selectedDate) {
      const params = new URLSearchParams({ date: selectedDate })
      router.replace(`?${params.toString()}`, { scroll: false })
    }
  }, [selectedDate, router])

  const handleSignup = async (slotId: string) => {
    try {
      setSignuping(slotId)
      await apiAdorationSignup(slotId)
      await mutate()
    } catch (err) {
      alert('Chyba při přihlašování na adoraci.')
      console.error('Adoration signup error:', err)
    } finally {
      setSignuping(null)
    }
  }

  return (
    <div>
      <div className="mb-3">
        <div className="d-inline-flex align-items-center gap-2">
          <label htmlFor="datePicker" className="form-label m-0">
            Vyber datum:
          </label>
          <input
            id="datePicker"
            type="date"
            className="form-control form-control-sm"
            style={{ width: '160px' }}
            value={selectedDate || ''}
            onChange={e => setSelectedDate(e.target.value)}
            min={eventStart}
            max={eventEnd}
          />
        </div>
      </div>

      {isLoading ? (
        <p>Načítám adorace...</p>
      ) : (
        <div className="table-responsive">
          <table className="table table-bordered table-sm mt-3">
            <thead>
              <tr>
                <th style={{ width: '80px' }}>Začátek</th>
                <th style={{ width: '80px' }}>Konec</th>
                <th style={{ width: '80px' }}>Délka</th>
                <th>Místo</th>
                <th style={{ width: '120px' }}>Obsazenost</th>
                <th style={{ width: '120px' }}>Akce</th>
              </tr>
            </thead>
            <tbody>
              {slots.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center">
                    Žádné dostupné adorace pro tento den.
                  </td>
                </tr>
              )}
              {slots.map(slot => {
                const endTime = new Date(slot.localDateStart.getTime() + slot.length * 60000)
                return (
                  <tr key={slot.id}>
                    <td>{format(slot.localDateStart, 'HH:mm')}</td>
                    <td>{format(endTime, 'HH:mm')}</td>
                    <td>{slot.length} min</td>
                    <td>{slot.location}</td>
                    <td>{`${slot.workerCount} / ${slot.capacity}`}</td>
                    <td>
                      {slot.isUserSignedUp ? (
                        <span className="badge bg-success">Přihlášen</span>
                      ) : (
                        <button
                          className="btn btn-sm btn-primary"
                          disabled={signuping === slot.id}
                          onClick={() => handleSignup(slot.id)}
                        >
                          {signuping === slot.id ? 'Přihlašuji...' : 'Přihlásit se'}
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
