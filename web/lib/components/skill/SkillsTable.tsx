import { SkillHasComplete } from 'lib/types/skill'
import { useAPISkillReorder } from 'lib/fetcher/skill'
import { DndSortableListTable } from '../table/DndSortableListTable'
import SkillRow from './SkillRow'

interface SkillTableProps {
  data?: SkillHasComplete[]
  reload: (expectedResult: SkillHasComplete[]) => void
}

export function SkillsTable({ data, reload }: SkillTableProps) {
  const { trigger: triggerReorder } = useAPISkillReorder()

  return (
    <DndSortableListTable<SkillHasComplete>
      data={data}
      columns={[
        { id: 'name', name: 'Název' },
        { id: 'actions', name: 'Akce', stickyRight: true },
      ]}
      emptyMessage="Žádné dovednosti"
      onReorder={async ids => {
        await triggerReorder({ ids })
      }}
      renderRow={item => (
        <SkillRow
          key={item.id}
          skill={item}
          onUpdated={() => reload((data ?? []).filter(s => s.id !== item.id))}
        />
      )}
    />
  )
}
