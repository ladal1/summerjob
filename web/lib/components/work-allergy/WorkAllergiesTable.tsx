import { WorkAllergyComplete } from 'lib/types/work-allergy'
import { useMemo, useState } from 'react'
import { MessageRow } from '../table/MessageRow'
import {
  SortOrder,
  SortableColumn,
  SortableTable,
} from '../table/SortableTable'
import { sortData } from '../table/SortData'
import WorkAllergyRow from './WorkAllergyRow'

const _columns: SortableColumn[] = [
  { id: 'name', name: 'Název' },
  {
    id: 'actions',
    name: 'Akce',
    notSortable: true,
    stickyRight: true,
  },
]

interface WorkAllergyTableProps {
  data?: WorkAllergyComplete[]
  reload: (expectedResult: WorkAllergyComplete[]) => void
}

export function WorkAllergiesTable({ data, reload }: WorkAllergyTableProps) {
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
      name: (workAllergy: WorkAllergyComplete) => workAllergy.name,
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
          message="Žádné pracovní alergie"
          colspan={_columns.length}
        />
      )}
      {data !== undefined &&
        sortedData.map(workAllergy => (
          <WorkAllergyRow
            key={workAllergy.id}
            workAllergy={workAllergy}
            onUpdated={() =>
              reload(data.filter(fa => fa.id !== workAllergy.id))
            }
          />
        ))}
    </SortableTable>
  )
}
