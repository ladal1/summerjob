'use client'

import { useState, useRef, useEffect } from 'react'
import { format } from 'date-fns'
import { fromZonedTime } from 'date-fns-tz'
import { useForm } from 'react-hook-form'
import type { FrontendAdorationSlot } from 'lib/types/adoration'

interface Props {
  slot: FrontendAdorationSlot
  onClose: () => void
  onUpdated: () => void
}

interface EditFormData {
  capacity: number
  fromTime: string
  toTime: string
  location: string
}

export default function AdorationEditModal({
  slot,
  onClose,
  onUpdated,
}: Props) {
  const [loading, setLoading] = useState(false)
  const backdropRef = useRef<HTMLDivElement>(null)

  // Calculate current end time
  const endTime = new Date(slot.localDateStart)
  endTime.setMinutes(endTime.getMinutes() + slot.length)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<EditFormData>({
    defaultValues: {
      capacity: slot.capacity,
      fromTime: format(slot.localDateStart, 'HH:mm'),
      toTime: format(endTime, 'HH:mm'),
      location: slot.location,
    },
  })

  const fromTime = watch('fromTime')
  const toTime = watch('toTime')

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

  const validateTimes = () => {
    if (!fromTime || !toTime) return 'Zadejte čas začátku a konce'
    
    // Validate time format using regex (same as create modal)
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
    if (!timeRegex.test(fromTime)) {
      return 'Neplatný formát času začátku. Použijte formát HH:MM (např. 08:30)'
    }
    if (!timeRegex.test(toTime)) {
      return 'Neplatný formát času konce. Použijte formát HH:MM (např. 17:15)'
    }
    
    const [fromHour, fromMinute] = fromTime.split(':').map(Number)
    const [toHour, toMinute] = toTime.split(':').map(Number)
    
    // Validate time range
    const fromTotalMinutes = fromHour * 60 + fromMinute
    const toTotalMinutes = toHour * 60 + toMinute
    
    if (fromTotalMinutes >= toTotalMinutes) {
      return 'Čas začátku musí být dříve než čas konce'
    }
    
    return null
  }

  const onSubmit = async (data: EditFormData) => {
    const timeError = validateTimes()
    if (timeError) {
      alert(timeError)
      return
    }

    setLoading(true)
    try {
      const [fromHour, fromMinute] = data.fromTime.split(':').map(Number)
      const [toHour, toMinute] = data.toTime.split(':').map(Number)
      
      const length = (toHour * 60 + toMinute) - (fromHour * 60 + fromMinute)

      // Convert user's Europe/Prague time to UTC time
      // The user sees and enters time in Europe/Prague timezone, but the server
      // API expects time values that when applied with setHours() will result in the correct UTC time.
      // Since setHours() operates in the server's local timezone (appears to be UTC),
      // we need to convert the user's Europe/Prague time to UTC.
      
      // Create a date representing the user's input time in Europe/Prague timezone
      const localDate = new Date(slot.localDateStart)
      const userInputDate = new Date(localDate.getFullYear(), localDate.getMonth(), localDate.getDate(), fromHour, fromMinute, 0, 0)
      
      // Convert from Europe/Prague to UTC
      const utcDate = fromZonedTime(userInputDate, 'Europe/Prague')
      
      // Extract UTC time components to send to API
      const utcFromMinute = utcDate.getUTCHours() * 60 + utcDate.getUTCMinutes()

      const response = await fetch(`/api/adoration/${slot.id}/edit`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          capacity: data.capacity,
          fromMinute: utcFromMinute,
          length: length,
          location: data.location,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Chyba při úpravě slotu')
      }

      onUpdated()
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
          <h5 className="mb-0">Upravit adorační slot</h5>
          <button type="button" className="btn-close" onClick={onClose}></button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="mb-3">
            <label htmlFor="location" className="form-label">Lokace</label>
            <input
              type="text"
              className="form-control"
              id="location"
              {...register('location', { required: 'Lokace je povinná' })}
            />
            {errors.location && (
              <div className="text-danger small">{errors.location.message}</div>
            )}
          </div>

          <div className="row mb-3">
            <div className="col-6">
              <label htmlFor="fromTime" className="form-label">Čas začátku</label>
              <input
                type="text"
                className="form-control"
                id="fromTime"
                placeholder="HH:MM"
                pattern="^([01]?[0-9]|2[0-3]):[0-5][0-9]$"
                {...register('fromTime', { required: 'Čas začátku je povinný' })}
              />
              <div className="form-text small">Formát: 24h (např. 08:30)</div>
              {errors.fromTime && (
                <div className="text-danger small">{errors.fromTime.message}</div>
              )}
            </div>
            <div className="col-6">
              <label htmlFor="toTime" className="form-label">Čas konce</label>
              <input
                type="text"
                className="form-control"
                id="toTime"
                placeholder="HH:MM"
                pattern="^([01]?[0-9]|2[0-3]):[0-5][0-9]$"
                {...register('toTime', { required: 'Čas konce je povinný' })}
              />
              <div className="form-text small">Formát: 24h (např. 17:15)</div>
              {errors.toTime && (
                <div className="text-danger small">{errors.toTime.message}</div>
              )}
            </div>
          </div>

          <div className="mb-3">
            <label htmlFor="capacity" className="form-label">Kapacita</label>
            <input
              type="number"
              className="form-control"
              id="capacity"
              min="1"
              max="20"
              {...register('capacity', { 
                required: 'Kapacita je povinná',
                min: { value: 1, message: 'Minimální kapacita je 1' },
                max: { value: 20, message: 'Maximální kapacita je 20' },
                valueAsNumber: true
              })}
            />
            {errors.capacity && (
              <div className="text-danger small">{errors.capacity.message}</div>
            )}
          </div>

          <div className="alert alert-info small">
            <strong>Aktuálně přiřazeno:</strong> {slot.workerCount} pracantů
            {slot.workers.length > 0 && (
              <div className="mt-1">
                {slot.workers.map((w, i) => (
                  <span key={i}>
                    {w.firstName} {w.lastName}
                    {i < slot.workers.length - 1 ? ', ' : ''}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="d-flex justify-content-end gap-2">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Zrušit
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Ukládám...' : 'Uložit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
