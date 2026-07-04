'use client'
import { useState } from 'react'

export default function ArrivalsExportButton() {
  const [includeHidden, setIncludeHidden] = useState(false)
  const href = `/api/arrivals/export-csv${
    includeHidden ? '?includeHidden=true' : ''
  }`

  return (
    <div className="d-flex align-items-center gap-3 flex-wrap">
      <div className="form-check form-switch mb-0">
        <input
          className="form-check-input"
          type="checkbox"
          role="switch"
          id="exportIncludeHidden"
          checked={includeHidden}
          onChange={e => setIncludeHidden(e.target.checked)}
        />
        <label className="form-check-label small" htmlFor="exportIncludeHidden">
          Včetně skrytých
        </label>
      </div>
      <a
        href={href}
        className="btn btn-secondary btn-with-icon"
        data-include-hidden={includeHidden}
      >
        <i className="fas fa-file-csv"></i>
        <span>Export CSV</span>
      </a>
    </div>
  )
}
