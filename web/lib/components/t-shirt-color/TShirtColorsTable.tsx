import { TShirtColorComplete } from 'lib/types/t-shirt-color'
import { useAPITShirtColorReorder } from 'lib/fetcher/t-shirt-color'
import { DndSortableListTable } from '../table/DndSortableListTable'
import TShirtColorRow from './TShirtColorRow'

interface TShirtColorsTableProps {
  data?: TShirtColorComplete[]
  reload: (expectedResult: TShirtColorComplete[]) => void
}

export function TShirtColorsTable({ data, reload }: TShirtColorsTableProps) {
  const { trigger: triggerReorder } = useAPITShirtColorReorder()

  return (
    <DndSortableListTable<TShirtColorComplete>
      data={data}
      columns={[
        { id: 'name', name: 'Název' },
        { id: 'actions', name: 'Akce', stickyRight: true },
      ]}
      emptyMessage="Žádné barvy trička"
      onReorder={async ids => {
        await triggerReorder({ ids })
      }}
      renderRow={item => (
        <TShirtColorRow
          key={item.id}
          tShirtColor={item}
          onUpdated={() => reload((data ?? []).filter(c => c.id !== item.id))}
        />
      )}
    />
  )
}
