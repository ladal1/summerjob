import { SkillHasComplete } from 'lib/types/skill'
import { useMemo, useState } from 'react'
import { MessageRow } from '../table/MessageRow'
import {
  SortOrder,
  SortableColumn,
  SortableTable,
} from '../table/SortableTable'
import { sortData } from '../table/SortData'
import SkillRow from './SkillRow'

const _columns: SortableColumn[] = [
  { id: 'name', name: 'Název' },
  {
    id: 'actions',
    name: 'Akce',
    notSortable: true,
    stickyRight: true,
  },
]

interface SkillTableProps {
  data?: SkillHasComplete[]
  reload: (expectedResult: SkillHasComplete[]) => void
}

export function SkillsTable({ data, reload }: SkillTableProps) {
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
      name: (skill: SkillHasComplete) => skill.name,
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
        <MessageRow message="Žádné dovednosti" colspan={_columns.length} />
      )}
      {data !== undefined &&
        sortedData.map(skill => (
          <SkillRow
            key={skill.id}
            skill={skill}
            onUpdated={() => reload(data.filter(s => s.id !== skill.id))}
          />
        ))}
    </SortableTable>
  )
}
