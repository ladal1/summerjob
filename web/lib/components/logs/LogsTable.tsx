import { Logging } from 'lib/prisma/client'
import { MessageRow } from '../table/MessageRow'
import { SortableColumn, SortableTable } from '../table/SortableTable'
import LogRow from './LogRow'

interface LogsTableProps {
  logs: Logging[]
}

export default function LogsTable({ logs }: LogsTableProps) {
  return (
    <SortableTable columns={_columns}>
      {logs.length === 0 && (
        <MessageRow message="Žádné logy" colspan={_columns.length} />
      )}
      {logs.map(log => (
        <LogRow key={log.id} log={log} />
      ))}
    </SortableTable>
  )
}

const _columns: SortableColumn[] = [
  { id: 'time', name: 'Čas', notSortable: true },
  { id: 'type', name: 'Typ', notSortable: true },
  { id: 'author', name: 'Autor', notSortable: true },
  { id: 'data', name: 'Data', notSortable: true },
]
