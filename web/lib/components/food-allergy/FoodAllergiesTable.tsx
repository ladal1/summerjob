import { FoodAllergyComplete } from 'lib/types/food-allergy'
import { useAPIFoodAllergyReorder } from 'lib/fetcher/food-allergy'
import { DndSortableListTable } from '../table/DndSortableListTable'
import FoodAllergyRow from './FoodAllergyRow'

interface FoodAllergyTableProps {
  data?: FoodAllergyComplete[]
  reload: (expectedResult: FoodAllergyComplete[]) => void
}

export function FoodAllergiesTable({ data, reload }: FoodAllergyTableProps) {
  const { trigger: triggerReorder } = useAPIFoodAllergyReorder()

  return (
    <DndSortableListTable<FoodAllergyComplete>
      data={data}
      columns={[
        { id: 'name', name: 'Název' },
        { id: 'actions', name: 'Akce', stickyRight: true },
      ]}
      emptyMessage="Žádné alergie na jídlo"
      onReorder={async ids => {
        await triggerReorder({ ids })
      }}
      renderRow={item => (
        <FoodAllergyRow
          key={item.id}
          foodAllergy={item}
          onUpdated={() => reload((data ?? []).filter(fa => fa.id !== item.id))}
        />
      )}
    />
  )
}
