'use client'
import { WorkerComplete } from 'lib/types/worker'

interface Props {
  workers: WorkerComplete[]
  selectedIds: Set<string>
  onToggle: (workerId: string) => void
  // Optional bulk-set callback. If provided, picker renders quick action buttons
  // (select all / only allergic / clear). Avoids spamming onToggle N times.
  onSetSelection?: (ids: Set<string>) => void
}

export default function RecipientPicker({
  workers,
  selectedIds,
  onToggle,
  onSetSelection,
}: Props) {
  if (workers.length === 0) {
    return <div className="text-muted small">Žádní pracovníci</div>
  }
  const allergicIds = workers
    .filter(w => w.foodAllergies.length > 0)
    .map(w => w.id)
  const allIds = workers.map(w => w.id)
  return (
    <div className="d-flex flex-column gap-1">
      {onSetSelection && workers.length > 1 && (
        <div className="d-flex flex-wrap gap-1 mb-1">
          <button
            type="button"
            className="btn btn-sm btn-outline-primary py-0 px-2"
            onClick={() => onSetSelection(new Set(allIds))}
            title="Vybrat všechny pracovníky"
          >
            <i className="fas fa-check-double me-1"></i>
            Všichni
          </button>
          {allergicIds.length > 0 && (
            <button
              type="button"
              className="btn btn-sm btn-outline-danger py-0 px-2"
              onClick={() => onSetSelection(new Set(allergicIds))}
              title="Vybrat jen pracovníky s alergiemi"
            >
              <i className="fas fa-apple-alt me-1"></i>
              Jen alergici
            </button>
          )}
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary py-0 px-2"
            onClick={() => onSetSelection(new Set())}
            title="Zrušit výběr"
            disabled={selectedIds.size === 0}
          >
            <i className="fas fa-times me-1"></i>
            Žádný
          </button>
        </div>
      )}
      <div role="list" className="d-flex flex-column gap-1">
        {workers.map(w => {
          const allergies = w.foodAllergies.map(a => a.name)
          return (
            <label
              key={w.id}
              role="listitem"
              className="d-flex align-items-center gap-2 small"
              style={{ cursor: 'pointer' }}
            >
              <input
                type="checkbox"
                className="form-check-input m-0"
                checked={selectedIds.has(w.id)}
                onChange={() => onToggle(w.id)}
              />
              <span>
                {w.firstName} {w.lastName}
                {allergies.length > 0 && (
                  <span className="badge bg-danger ms-2">
                    {allergies.join(', ')}
                  </span>
                )}
              </span>
            </label>
          )
        })}
      </div>
    </div>
  )
}
