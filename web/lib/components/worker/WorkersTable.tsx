import { WorkerComplete } from 'lib/types/worker'
import { MessageRow } from '../table/MessageRow'
import WorkerRow from './WorkerRow'

interface WorkersTableProps {
  workers: WorkerComplete[]
  onUpdated: () => void
}

export default function WorkersTable({
  workers,
  onUpdated,
}: WorkersTableProps) {
  return (
    <div className="table-responsive text-nowrap mb-2 smj-shadow rounded-3">
      <table className="table table-hover mb-0">
        <thead className="smj-table-header">
          <tr>
            {_columns.map(column => (
              <th key={column}>{column}</th>
            ))}
          </tr>
        </thead>
        <tbody className="smj-table-body mb-0">
          {workers.length === 0 && (
            <MessageRow message="Žádní pracanti" colspan={_columns.length} />
          )}
          {workers.map(worker => (
            <WorkerRow key={worker.id} worker={worker} onUpdated={onUpdated} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

const _columns = [
  'Jméno',
  'Příjmení',
  'Telefonní číslo',
  'E-mail',
  'Vlastnosti',
  'Akce',
]
