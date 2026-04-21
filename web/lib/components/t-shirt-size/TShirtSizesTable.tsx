import { TShirtSizeComplete } from 'lib/types/t-shirt-size'
import { useAPITShirtSizeReorder } from 'lib/fetcher/t-shirt-size'
import { DndSortableListTable } from '../table/DndSortableListTable'
import TShirtSizeRow from './TShirtSizeRow'

interface TShirtSizesTableProps {
  data?: TShirtSizeComplete[]
  reload: (expectedResult: TShirtSizeComplete[]) => void
}

export function TShirtSizesTable({ data, reload }: TShirtSizesTableProps) {
  const { trigger: triggerReorder } = useAPITShirtSizeReorder()

  return (
    <DndSortableListTable<TShirtSizeComplete>
      data={data}
      columns={[
        { id: 'name', name: 'Název' },
        { id: 'actions', name: 'Akce', stickyRight: true },
      ]}
      emptyMessage="Žádné velikosti trička"
      onReorder={async ids => {
        await triggerReorder({ ids })
      }}
      renderRow={item => (
        <TShirtSizeRow
          key={item.id}
          tShirtSize={item}
          onUpdated={() => reload((data ?? []).filter(s => s.id !== item.id))}
        />
      )}
    />
  )
}
