import { FoodAllergyComplete } from 'lib/types/food-allergy'
import { useMemo, useState } from 'react'
import { MessageRow } from '../table/MessageRow'
import {
  SortOrder,
  SortableColumn,
  SortableTable,
} from '../table/SortableTable'
import { sortData } from '../table/SortData'
import FoodAllergyRow from './FoodAllergyRow'

const _columns: SortableColumn[] = [
  { id: 'name', name: 'Název' },
  {
    id: 'actions',
    name: 'Akce',
    notSortable: true,
    stickyRight: true,
  },
]

interface FoodAllergyTableProps {
  data?: FoodAllergyComplete[]
  reload: (expectedResult: FoodAllergyComplete[]) => void
}

export function FoodAllergiesTable({ data, reload }: FoodAllergyTableProps) {
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
      name: (foodAllergy: FoodAllergyComplete) => foodAllergy.name,
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
        sortedData.map(foodAllergy => (
          <FoodAllergyRow
            key={foodAllergy.id}
            foodAllergy={foodAllergy}
            onUpdated={() =>
              reload(data.filter(fa => fa.id !== foodAllergy.id))
            }
          />
        ))}
    </SortableTable>
  )
}
