'use client'

import { useState } from 'react'

interface InfoBoxProps {
  message: string
}

export function InfoBox({ message }: InfoBoxProps) {
  const [visible, setVisible] = useState(true)

  if (!visible) {
    return null
  }

  return (
    <div
      className="infobox d-flex align-items-start text-white bg-primary border-0 p-3 rounded shadow-sm mt-3"
      role="alert"
    >
      <div className="me-3 d-flex align-items-center">
        <i className="fa-solid fa-circle-info text-white fs-4"></i>
      </div>
      <div className="flex-grow-1">{message}</div>
      <button
        type="button"
        className="btn-close btn-close-white ms-3"
        onClick={() => setVisible(false)}
        aria-label="Zavřít"
      ></button>
    </div>
  )
}
