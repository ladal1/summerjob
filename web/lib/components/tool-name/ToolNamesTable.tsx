import { ToolNameComplete } from 'lib/types/tool-name'
import { useMemo, useState } from 'react'
import { MessageRow } from '../table/MessageRow'
import {
  SortOrder,
  SortableColumn,
  SortableTable,
} from '../table/SortableTable'
import { sortData } from '../table/SortData'
import ToolNameRow from './ToolNameRow'

const _columns: SortableColumn[] = [
  { id: 'name', name: 'Název' },
  { id: 'skills', name: 'Dovednosti', notSortable: true },
  { id: 'jobTypes', name: 'Typy práce', notSortable: true },
  {
    id: 'actions',
    name: 'Akce',
    notSortable: true,
    stickyRight: true,
  },
]

interface ToolNameTableProps {
  data?: ToolNameComplete[]
  reload: (expectedResult: ToolNameComplete[]) => void
}

export function ToolNamesTable({ data, reload }: ToolNameTableProps) {
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
      name: (toolName: ToolNameComplete) => toolName.name,
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
        <MessageRow message="Žádné nástroje" colspan={_columns.length} />
      )}
      {data !== undefined &&
        sortedData.map(toolName => (
          <ToolNameRow
            key={toolName.id}
            toolName={toolName}
            onUpdated={() => reload(data.filter(fa => fa.id !== toolName.id))}
          />
        ))}
    </SortableTable>
  )
}
