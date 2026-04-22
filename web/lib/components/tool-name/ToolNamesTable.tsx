import { ToolNameComplete } from 'lib/types/tool-name'
import { useAPIToolNameReorder } from 'lib/fetcher/tool-name'
import { DndSortableListTable } from '../table/DndSortableListTable'
import ToolNameRow from './ToolNameRow'

interface ToolNameTableProps {
  data?: ToolNameComplete[]
  reload: (expectedResult: ToolNameComplete[]) => void
}

export function ToolNamesTable({ data, reload }: ToolNameTableProps) {
  const { trigger: triggerReorder } = useAPIToolNameReorder()

  return (
    <DndSortableListTable<ToolNameComplete>
      data={data}
      columns={[
        { id: 'name', name: 'Název' },
        { id: 'skills', name: 'Dovednosti' },
        { id: 'jobTypes', name: 'Typy práce' },
        { id: 'actions', name: 'Akce', stickyRight: true },
      ]}
      emptyMessage="Žádné nástroje"
      onReorder={async ids => {
        await triggerReorder({ ids })
      }}
      renderRow={item => (
        <ToolNameRow
          key={item.id}
          toolName={item}
          onUpdated={() => reload((data ?? []).filter(tn => tn.id !== item.id))}
        />
      )}
    />
  )
}
