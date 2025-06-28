'use client'

import { format } from 'date-fns'
import {
  useAPIAdorationSlotsUser,
  useAPIAdorationSignup,
  useAPIAdorationLogout,
} from 'lib/fetcher/adoration'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

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
  const router = useRouter()
  const searchParams = useSearchParams()

  const computeInitialDate = () => {
    const urlDate = searchParams?.get('date')
    if (urlDate) return urlDate

    const today = new Date()
    const start = new Date(eventStart)

    return today < start ? eventStart : today.toISOString().slice(0, 10)
  }

  const [selectedDate, setSelectedDate] = useState(computeInitialDate)
  const {
    data: slots = [],
    isLoading,
    mutate,
  } = useAPIAdorationSlotsUser(selectedDate, eventId)
  const [signuping, setSignuping] = useState<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams({ date: selectedDate })
    router.replace(`?${params.toString()}`, { scroll: false })
  }, [selectedDate, router])

  const handleSignup = async (slotId: string) => {
    try {
      setSignuping(slotId)
      await useAPIAdorationSignup(slotId)
      await mutate()
    } catch (err) {
      alert('Chyba při přihlašování na adoraci.')
    } finally {
      setSignuping(null)
    }
  }

  const handleLogout = async (slotId: string) => {
    try {
      setSignuping(slotId)
      await useAPIAdorationLogout(slotId)
      await mutate()
    } catch (err) {
      alert('Chyba při odhlašování z adorace.')
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
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            min={eventStart}
            max={eventEnd}
          />
        </div>
      </div>

      {isLoading ? (
        <p>Načítám adorace...</p>
      ) : (
        <table className="table table-bordered table-sm mt-3">
          <thead>
            <tr>
              <th>Čas</th>
              <th>Místo</th>
              <th>Obsazenost</th>
              <th>Akce</th>
            </tr>
          </thead>
          <tbody>
            {slots.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center">
                  Žádné dostupné adorace pro tento den.
                </td>
              </tr>
            )}
            {slots.map(slot => (
              <tr key={slot.id}>
                <td>{format(slot.localDateStart, 'HH:mm')}</td>
                <td>{slot.location}</td>
                <td>{`${slot.workerCount} / ${slot.capacity}`}</td>
                <td>
                  {slot.isUserSignedUp ? (
                    <button
                      className="btn btn-sm btn-outline-danger"
                      disabled={signuping === slot.id}
                      onClick={() => handleLogout(slot.id)}
                    >
                      {signuping === slot.id ? 'Odhlašuji...' : 'Odhlásit se'}
                    </button>
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
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
