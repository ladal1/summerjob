import { Logging } from 'lib/prisma/client'
import { MessageRow } from '../table/MessageRow'
import LogRow from './LogRow'

interface LogsTableProps {
  logs: Logging[]
}

export default function LogsTable({ logs }: LogsTableProps) {
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
          {logs.length === 0 && (
            <MessageRow message="Žádné logy" colspan={_columns.length} />
          )}
          {logs.map(log => (
            <LogRow key={log.id} log={log} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

const _columns = ['Čas', 'Typ', 'Autor', 'Data']
