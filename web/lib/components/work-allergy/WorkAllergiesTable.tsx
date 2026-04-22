import { WorkAllergyComplete } from 'lib/types/work-allergy'
import { useAPIWorkAllergyReorder } from 'lib/fetcher/work-allergy'
import { DndSortableListTable } from '../table/DndSortableListTable'
import WorkAllergyRow from './WorkAllergyRow'

interface WorkAllergyTableProps {
  data?: WorkAllergyComplete[]
  reload: (expectedResult: WorkAllergyComplete[]) => void
}

export function WorkAllergiesTable({ data, reload }: WorkAllergyTableProps) {
  const { trigger: triggerReorder } = useAPIWorkAllergyReorder()

  return (
    <DndSortableListTable<WorkAllergyComplete>
      data={data}
      columns={[
        { id: 'name', name: 'Název' },
        { id: 'actions', name: 'Akce', stickyRight: true },
      ]}
      emptyMessage="Žádné pracovní alergie"
      onReorder={async ids => {
        await triggerReorder({ ids })
      }}
      renderRow={item => (
        <WorkAllergyRow
          key={item.id}
          workAllergy={item}
          onUpdated={() => reload((data ?? []).filter(wa => wa.id !== item.id))}
        />
      )}
    />
  )
}
