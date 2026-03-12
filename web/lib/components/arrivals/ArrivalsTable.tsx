'use client'
import { ArrivalWorker } from 'lib/types/arrival'
import {
  SortableTable,
  SortableColumn,
  SortOrder,
} from '../table/SortableTable'
import { MessageRow } from '../table/MessageRow'
import { useMemo, useState } from 'react'
import ArrivalRow from './ArrivalRow'

const _columns: SortableColumn[] = [
  { id: 'name', name: 'Jméno' },
  { id: 'phone', name: 'Telefon' },
  { id: 'birthDate', name: 'Datum narození' },
  { id: 'cars', name: 'Auta', notSortable: true },
  {
    id: 'actions',
    name: 'Akce',
    notSortable: true,
    stickyRight: true,
  },
]

interface ArrivalsTableProps {
  workers: ArrivalWorker[]
  onUpdated: () => void
}

export default function ArrivalsTable({
  workers,
  onUpdated,
}: ArrivalsTableProps) {
  const [sortOrder, setSortOrder] = useState<SortOrder>({
    columnId: 'name',
    direction: 'asc',
  })

  const sortedData = useMemo(
    () => sortWorkers(workers, sortOrder),
    [workers, sortOrder]
  )

  return (
    <SortableTable
      columns={_columns}
      currentSort={sortOrder}
      onRequestedSort={setSortOrder}
    >
      {workers.length === 0 && (
        <MessageRow message="Žádní pracanti" colspan={_columns.length} />
      )}
      {sortedData.map(worker => (
        <ArrivalRow key={worker.id} worker={worker} onUpdated={onUpdated} />
      ))}
    </SortableTable>
  )
}

function getSortable(worker: ArrivalWorker, columnId: string): string {
  switch (columnId) {
    case 'name':
      return `${worker.firstName} ${worker.lastName}`.toLowerCase()
    case 'phone':
      return worker.phone
    case 'birthDate':
      return worker.birthDate ?? ''
    default:
      return ''
  }
}

function sortWorkers(
  workers: ArrivalWorker[],
  sortOrder: SortOrder
): ArrivalWorker[] {
  if (!sortOrder.columnId) return workers
  const sorted = [...workers].sort((a, b) => {
    const aVal = getSortable(a, sortOrder.columnId!)
    const bVal = getSortable(b, sortOrder.columnId!)
    return aVal.localeCompare(bVal, 'cs')
  })
  if (sortOrder.direction === 'desc') sorted.reverse()
  return sorted
}
