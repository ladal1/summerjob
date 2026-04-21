'use client'

import { useState } from 'react'

interface TShirtPriceFormProps {
  eventId: string
  initialPrice: number | null
}

export default function TShirtPriceForm({
  eventId,
  initialPrice,
}: TShirtPriceFormProps) {
  const [price, setPrice] = useState<string>(
    initialPrice !== null ? String(initialPrice) : ''
  )
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSave = async () => {
    setLoading(true)
    setError(null)
    setMessage(null)

    const parsed = price.trim() === '' ? null : Number(price)
    if (parsed !== null && (Number.isNaN(parsed) || parsed < 0)) {
      setError('Zadejte platné nezáporné číslo, nebo nechte prázdné.')
      setLoading(false)
      return
    }

    const formData = new FormData()
    formData.append('jsonData', JSON.stringify({ tShirtPrice: parsed }))

    const res = await fetch(
      `/api/summerjob-events/${eventId}/set-tshirt-price`,
      {
        method: 'POST',
        body: formData,
      }
    )

    if (!res.ok) {
      setError('Chyba při ukládání ceny.')
    } else {
      setMessage('Cena uložena.')
      setTimeout(() => setMessage(null), 2000)
    }

    setLoading(false)
  }

  return (
    <div className="mt-3">
      <div className="mb-2">
        <label className="fs-5">Cena trička (Kč)</label>
        <p className="text-muted">
          Cena se zobrazí v přihlášce vedle zájmu o tričko. Pro skrytí částky
          nechte prázdné.
        </p>
      </div>

      <div className="d-flex gap-3 align-items-center flex-column flex-sm-row">
        <input
          type="number"
          min={0}
          className="form-control flex-grow-1 p-0"
          placeholder="Např. 350"
          value={price}
          onChange={e => setPrice(e.target.value)}
        />
        <button
          type="button"
          className="btn btn-outline-primary text-nowrap"
          onClick={handleSave}
          disabled={loading}
        >
          {loading ? 'Ukládání...' : 'Uložit cenu'}
        </button>
      </div>

      {error && <p className="text-danger mt-2">{error}</p>}
      {message && <p className="text-success mt-2">{message}</p>}
    </div>
  )
}
