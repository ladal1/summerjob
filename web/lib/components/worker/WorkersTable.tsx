import { WorkerComplete } from 'lib/types/worker'
import { useMemo, useState } from 'react'
import { MessageRow } from '../table/MessageRow'
import { sortData } from '../table/SortData'
import {
  SortOrder,
  SortableColumn,
  SortableTable,
} from '../table/SortableTable'
import WorkerRow from './WorkerRow'

const _columns: SortableColumn[] = [
  { id: 'firstName', name: 'Jméno' },
  { id: 'lastName', name: 'Příjmení' },
  { id: 'phone', name: 'Telefonní číslo' },
  { id: 'email', name: 'E-mail' },
  { id: 'skills', name: 'Vlastnosti' },
  {
    id: 'actions',
    name: 'Akce',
    notSortable: true,
    stickyRight: true,
  },
]

interface WorkersTableProps {
  workers: WorkerComplete[]
  onUpdated: () => void
  onHover: (url: string | null) => void
}

export default function WorkersTable({
  workers,
  onUpdated,
  onHover,
}: WorkersTableProps) {
  //#region Sort
  const [sortOrder, setSortOrder] = useState<SortOrder>({
    columnId: undefined,
    direction: 'desc',
  })
  const onSortRequested = (direction: SortOrder) => {
    setSortOrder(direction)
  }

  // names has to be same as collumns ids
  const getSortable = useMemo(
    () => ({
      firstName: (worker: WorkerComplete) => worker.firstName,
      lastName: (worker: WorkerComplete) => worker.lastName,
      phone: (worker: WorkerComplete) => worker.phone,
      email: (worker: WorkerComplete) => worker.email,
      skills: (worker: WorkerComplete) =>
        `${+!worker.cars.length > 0}${+!worker.isStrong}${+!worker.isTeam}`,
    }),
    []
  )

  const sortedData = useMemo(() => {
    return workers ? sortData(workers, getSortable, sortOrder) : []
  }, [workers, getSortable, sortOrder])
  //#endregion

  return (
    <SortableTable
      columns={_columns}
      currentSort={sortOrder}
      onRequestedSort={onSortRequested}
    >
      {workers.length === 0 && (
        <MessageRow message="Žádní pracanti" colspan={_columns.length} />
      )}
      {sortedData.map(worker => (
        <WorkerRow
          key={worker.id}
          worker={worker}
          onUpdated={onUpdated}
          onHover={onHover}
        />
      ))}
    </SortableTable>
  )
}
