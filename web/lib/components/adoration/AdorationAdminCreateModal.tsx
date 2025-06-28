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
  const [from, setFrom] = useState('08:00')
  const [to, setTo] = useState('17:00')
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

      await createBulk({
        eventId,
        dateFrom,
        dateTo,
        fromHour: parseInt(from.split(':')[0]),
        toHour: parseInt(to.split(':')[0]),
        length,
        location,
        capacity,
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
            <label className="form-label fw-bold">Od</label>
            <input
              type="time"
              className="form-control pt-0"
              value={from}
              onChange={e => setFrom(e.target.value)}
            />
          </div>
          <div className="col-md-3">
            <label className="form-label fw-bold">Do</label>
            <input
              type="time"
              className="form-control pt-0"
              value={to}
              onChange={e => setTo(e.target.value)}
            />
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