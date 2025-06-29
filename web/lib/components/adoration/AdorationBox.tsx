'use client'
import { useRouter } from 'next/navigation'
import React from 'react'

export default function AdorationBox() {
  const router = useRouter()

  return (
    <div
      className="card p-3 shadow-sm border border-info bg-light cursor-pointer h-100"
      onClick={() => router.push('/adoration')}
      style={{ transition: '0.2s', cursor: 'pointer' }}
    >
      <div className="d-flex align-items-center gap-2 mb-2 text-primary">
        <i className="fas fa-church fa-lg"></i>
        <h5 className="m-0">Adorace</h5>
      </div>
      <p className="text-muted mb-0">
        Klikni pro zobrazení slotů pro adoraci. Přihlas se na konkrétní čas.
      </p>
    </div>
  )
}
