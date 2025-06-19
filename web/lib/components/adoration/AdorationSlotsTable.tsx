'use client'

import { format } from 'date-fns'
import { useAPIAdorationSlots, useAPIAdorationSignup } from 'lib/fetcher/adoration'
import { useState } from 'react'

interface Props {
  eventId: string
  initialDate: string
  eventStart: string
  eventEnd: string
}

export default function AdorationSlotsTable({
  eventId,
  initialDate,
  eventStart,
  eventEnd,
}: Props) {
  const [selectedDate, setSelectedDate] = useState(initialDate)
  const { data: slots = [], isLoading, mutate } = useAPIAdorationSlots(selectedDate, eventId)
  const [signuping, setSignuping] = useState<string | null>(null)

  const handleSignup = async (slotId: string) => {
    try {
      setSignuping(slotId)
      const signup = await useAPIAdorationSignup(slotId)
      await signup()
      await mutate()
    } catch (err) {
      alert('Chyba při přihlašování na adoraci.')
    } finally {
      setSignuping(null)
    }
  }

  return (
    <div>
      <div className="mb-3 d-flex align-items-center gap-2">
        <label htmlFor="datePicker" className="form-label m-0">
          Vyber datum:
        </label>
        <input
          id="datePicker"
          type="date"
          className="form-control form-control-sm"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          min={eventStart}
          max={eventEnd}
        />
      </div>

      {isLoading ? (
        <p>Načítám adorace...</p>
      ) : (
        <table className="table table-bordered table-sm mt-3">
          <thead>
            <tr>
              <th>Čas</th>
              <th>Místo</th>
              <th>Přihlášený</th>
              <th>Akce</th>
            </tr>
          </thead>
          <tbody>
            {slots.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center">
                  Žádné dostupné adorace pro tento den. Zkuste vybrat jiné datum.
                </td>
              </tr>
            )}
            {slots.map((slot) => (
              <tr key={slot.id}>
                <td>{slot.hour}:00</td>
                <td>{slot.location}</td>
                <td>
                  {slot.worker
                    ? `${slot.worker.firstName} ${slot.worker.lastName}`
                    : '—'}
                </td>
                <td>
                  {!slot.worker && (
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
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
