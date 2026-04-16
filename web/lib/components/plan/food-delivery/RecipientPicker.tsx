'use client'
import { WorkerComplete } from 'lib/types/worker'

interface Props {
  workers: WorkerComplete[]
  selectedIds: Set<string>
  onToggle: (workerId: string) => void
}

export default function RecipientPicker({
  workers,
  selectedIds,
  onToggle,
}: Props) {
  if (workers.length === 0) {
    return <div className="text-muted small">Žádní pracovníci</div>
  }
  return (
    <div className="d-flex flex-column gap-1">
      {workers.map(w => {
        const allergies = w.foodAllergies.map(a => a.name)
        return (
          <label
            key={w.id}
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
  )
}
