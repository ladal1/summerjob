'use client'

import { format } from 'date-fns'
import { cs } from 'date-fns/locale'
import { toZonedTime } from 'date-fns-tz'
import {
  useAPIAdorationSlotsAllUser,
  apiAdorationSignup,
} from 'lib/fetcher/adoration'
import { useState } from 'react'
import type { FrontendAdorationSlot } from 'lib/types/adoration'

interface Props {
  eventId: string
  eventStart: string
  eventEnd: string
}

export default function AdorationSlotsTable({
  eventId,
}: Props) {
  const {
    data: allSlots = [],
    isLoading,
    mutate,
  } = useAPIAdorationSlotsAllUser(eventId)
  
  const [signuping, setSignuping] = useState<string | null>(null)
  
  // Filter out past slots and group by date
  const now = toZonedTime(new Date(), 'Europe/Prague')
  const futureSlots = allSlots.filter((slot) => {
    const slotEndTime = new Date(slot.localDateStart.getTime() + slot.length * 60000)
    return slotEndTime > now
  })
  
  // Filter out full slots, but keep those where the user is signed up
  const availableSlots = futureSlots.filter((slot) => 
    slot.workerCount < slot.capacity || slot.isUserSignedUp
  )
  
  // Group slots by date
  const slotsByDate = availableSlots.reduce((acc: Record<string, FrontendAdorationSlot[]>, slot) => {
    // Use the local date components to avoid timezone issues
    const localDate = slot.localDateStart
    const year = localDate.getFullYear()
    const month = String(localDate.getMonth() + 1).padStart(2, '0')
    const day = String(localDate.getDate()).padStart(2, '0')
    const dateKey = `${year}-${month}-${day}`
    
    if (!acc[dateKey]) {
      acc[dateKey] = []
    }
    acc[dateKey].push(slot)
    return acc
  }, {})
  
  // Sort dates and slots within each date
  const sortedDates = Object.keys(slotsByDate).sort()
  sortedDates.forEach(date => {
    slotsByDate[date].sort((a, b) => 
      a.localDateStart.getTime() - b.localDateStart.getTime()
    )
  })

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
      {isLoading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Načítám adorace...</span>
          </div>
          <p className="mt-2 text-muted">Načítám adorace...</p>
        </div>
      ) : sortedDates.length === 0 ? (
        <div className="text-center py-5">
          <div className="mb-3">
            <i className="fas fa-calendar-times fa-3x text-muted"></i>
          </div>
          <h5 className="text-muted">Žádné dostupné adorace</h5>
          <p className="text-muted">Momentálně nejsou k dispozici žádné adorační časy.</p>
        </div>
      ) : (
        <div className="adoration-slots">
          {sortedDates.map(date => {
            const formattedDate = format(new Date(date), 'EEEE d. MMMM yyyy', { locale: cs })
            const capitalizedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1)
            
            return (
              <div key={date} className="mb-4">
                <div className="d-flex align-items-center mb-3">
                  <div className="bg-primary rounded-circle d-flex align-items-center justify-content-center me-3" style={{width: '40px', height: '40px'}}>
                    <i className="fas fa-calendar-day text-white"></i>
                  </div>
                  <div>
                    <h4 className="mb-0 text-primary">{capitalizedDate}</h4>
                  </div>
                </div>
            <div className="table-responsive">
              <table className="table table-bordered table-sm">
                <thead className="table-primary">
                  <tr>
                    <th style={{ width: '120px' }} className="text-center d-none d-md-table-cell">Čas</th>
                    <th style={{ width: '60px' }} className="text-center d-md-none">Čas</th>
                    <th style={{ width: '200px' }}>Místo</th>
                    <th style={{ width: '180px' }}>Akce</th>
                  </tr>
                </thead>
                <tbody>
                  {slotsByDate[date].map(slot => {
                    const endTime = new Date(slot.localDateStart.getTime() + slot.length * 60000)
                    const startTimeStr = format(slot.localDateStart, 'HH:mm')
                    const endTimeStr = format(endTime, 'HH:mm')
                    return (
                      <tr key={slot.id}>
                        <td className="text-center d-none d-md-table-cell">
                          {startTimeStr} - {endTimeStr}
                        </td>
                        <td className="text-center d-md-none" style={{ width: '60px' }}>
                          {startTimeStr}<br/>-<br/>{endTimeStr}
                        </td>
                        <td>{slot.location}</td>
                        <td>
                          {slot.isUserSignedUp ? (
                            <span className="badge bg-success">Přihlášen ({slot.workerCount}/{slot.capacity})</span>
                          ) : (
                            <button
                              className="btn btn-sm btn-primary"
                              disabled={signuping === slot.id}
                              onClick={() => handleSignup(slot.id)}
                            >
                              {signuping === slot.id ? 'Přihlašuji...' : `Přihlásit se (${slot.workerCount}/${slot.capacity})`}
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
          )
        })}
        </div>
      )}
    </div>
  )
}
