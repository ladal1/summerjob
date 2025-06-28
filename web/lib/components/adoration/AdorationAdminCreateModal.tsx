'use client'

import { useState, useRef, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { DatePickerInput } from 'lib/components/forms/input/DatePickerInput'
import 'react-datepicker/dist/react-datepicker.css'
import { useAPIAdorationCreateBulk } from 'lib/fetcher/adoration'

interface Props {
  eventId: string
  eventStart: string
  eventEnd: string
  onClose: () => void
  onCreated: (date: string) => void
}

const slotLengths = [15, 30, 45, 60]

export default function AdminCreateAdorationModal({
  eventId,
  eventStart,
  eventEnd,
  onClose,
  onCreated,
}: Props) {
  const [fromTime, setFromTime] = useState('08:00')
  const [toTime, setToTime] = useState('17:00')
  const [length, setLength] = useState(60)
  const [capacity, setCapacity] = useState(1)
  const [loading, setLoading] = useState(false)

  const backdropRef = useRef<HTMLDivElement>(null)

  const {
    register,
    control,
    setError,
    clearErrors,
    getValues,
    formState: { errors },
    handleSubmit: formHandleSubmit,
  } = useForm({
    defaultValues: {
      dateFrom: eventStart,
      dateTo: eventEnd,
      location: ''
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

  const { trigger: createBulk } = useAPIAdorationCreateBulk()

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const { dateFrom, dateTo, location } = getValues()

      // Validate time format
      const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
      if (!timeRegex.test(fromTime)) {
        alert('Neplatný formát času "Od". Použijte formát HH:MM (např. 08:30)')
        setLoading(false)
        return
      }
      if (!timeRegex.test(toTime)) {
        alert('Neplatný formát času "Do". Použijte formát HH:MM (např. 17:15)')
        setLoading(false)
        return
      }

      // Parse fromTime and toTime (HH:mm format) to hour and minute
      const [fromHour, fromMinute] = fromTime.split(':').map(Number)
      const [toHour, toMinute] = toTime.split(':').map(Number)

      // Validate time range
      const fromTotalMinutes = fromHour * 60 + fromMinute
      const toTotalMinutes = toHour * 60 + toMinute
      if (fromTotalMinutes >= toTotalMinutes) {
        alert('Čas "Od" musí být dříve než čas "Do"')
        setLoading(false)
        return
      }

      await createBulk({
        eventId,
        dateFrom,
        dateTo,
        fromHour,
        toHour,
        length,
        location,
        capacity,
        fromMinute,
        toMinute,
      })
      onCreated(dateFrom)
      onClose()
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
      <div className="bg-white rounded shadow-lg p-4" style={{ width: '720px' }}>
        <div className="d-flex justify-content-between align-items-start mb-3">
          <h5 className="mb-0">Vytvořit nové sloty</h5>
          <button type="button" className="btn-close" onClick={onClose}></button>
        </div>

        <div className="row g-3">
          <div className="col-md-6 position-relative">
            <DatePickerInput
              id="dateFrom"
              label="Datum od"
              control={control}
              minDate={eventStart}
              maxDate={eventEnd}
              setError={setError}
              clearErrors={clearErrors}
            />
          </div>
          <div className="col-md-6 position-relative">
            <DatePickerInput
              id="dateTo"
              label="Datum do"
              control={control}
              minDate={eventStart}
              maxDate={eventEnd}
              setError={setError}
              clearErrors={clearErrors}
            />
          </div>

          <div className="col-md-3">
            <label className="form-label fw-bold">Od (čas)</label>
            <input
              type="text"
              className="form-control pt-0"
              value={fromTime}
              placeholder="HH:MM"
              pattern="^([01]?[0-9]|2[0-3]):[0-5][0-9]$"
              onChange={e => setFromTime(e.target.value)}
            />
            <div className="form-text">Formát: 24h (např. 08:30)</div>
          </div>
          <div className="col-md-3">
            <label className="form-label fw-bold">Do (čas)</label>
            <input
              type="text"
              className="form-control pt-0"
              value={toTime}
              placeholder="HH:MM"
              pattern="^([01]?[0-9]|2[0-3]):[0-5][0-9]$"
              onChange={e => setToTime(e.target.value)}
            />
            <div className="form-text">Formát: 24h (např. 17:15)</div>
          </div>
          <div className="col-md-3">
            <label className="form-label fw-bold">Délka slotu</label>
            <select
              className="form-select pt-0"
              value={length}
              onChange={e => setLength(Number(e.target.value))}
            >
              {slotLengths.map(len => (
                <option key={len} value={len}>
                  {len} minut
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-6">
            <label className="form-label fw-bold pt-0">Lokace</label>
            <input
              type="text"
              className={`form-control pt-0 ${errors.location ? 'is-invalid' : ''}`}
              placeholder="Např. Kaple 1"
              {...register('location', { required: 'Lokace je povinná' })}
            />
            {errors.location && (
              <div className="invalid-feedback">{errors.location.message}</div>
            )}
          </div>
          <div className="col-md-3">
            <label className="form-label fw-bold">Kapacita (počet lidí)</label>
            <input
              type="number"
              className="form-control pt-0"
              value={capacity}
              min={1}
              onChange={e => setCapacity(Number(e.target.value))}
            />
          </div>
        </div>

        <div className="mt-4 d-flex justify-content-between gap-2">
          <button className="btn btn-primary" onClick={formHandleSubmit(handleSubmit)} disabled={loading}>
            {loading ? 'Vytvářím...' : 'Vytvořit sloty'}
          </button>
          <button className="btn btn-secondary" onClick={onClose}>
            Zavřít
          </button>
        </div>
      </div>
    </div>
  )
}