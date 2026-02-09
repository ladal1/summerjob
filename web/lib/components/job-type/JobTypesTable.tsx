import { JobTypeComplete } from 'lib/types/job-type'
import { useMemo, useState } from 'react'
import { MessageRow } from '../table/MessageRow'
import {
  SortOrder,
  SortableColumn,
  SortableTable,
} from '../table/SortableTable'
import { sortData } from '../table/SortData'
import JobTypeRow from './JobTypeRow'

const _columns: SortableColumn[] = [
  { id: 'name', name: 'Název' },
  {
    id: 'actions',
    name: 'Akce',
    notSortable: true,
    stickyRight: true,
  },
]

interface JobTypeTableProps {
  data?: JobTypeComplete[]
  reload: (expectedResult: JobTypeComplete[]) => void
}

export function JobTypesTable({ data, reload }: JobTypeTableProps) {
  //#region Sort
  const [sortOrder, setSortOrder] = useState<SortOrder>({
    columnId: undefined,
    direction: 'desc',
  })
  const onSortRequested = (direction: SortOrder) => {
    setSortOrder(direction)
  }

  // names have to be same as collumns ids
  const getSortable = useMemo(
    () => ({
      name: (jobType: JobTypeComplete) => jobType.name,
    }),
    []
  )

  const sortedData = useMemo(() => {
    return data ? sortData(data, getSortable, sortOrder) : []
  }, [data, getSortable, sortOrder])
  //#endregion

  return (
    <SortableTable
      columns={_columns}
      currentSort={sortOrder}
      onRequestedSort={onSortRequested}
    >
      {data !== undefined && data.length === 0 && (
        <MessageRow
          message="Žádné alergie na jídlo"
          colspan={_columns.length}
        />
      )}
      {data !== undefined &&
        sortedData.map(jobType => (
          <JobTypeRow
            key={jobType.id}
            jobType={jobType}
            onUpdated={() => reload(data.filter(fa => fa.id !== jobType.id))}
          />
        ))}
    </SortableTable>
  )
}
