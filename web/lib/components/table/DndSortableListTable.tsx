import { ReactNode, useEffect, useState } from 'react'
import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import {
  restrictToParentElement,
  restrictToVerticalAxis,
} from '@dnd-kit/modifiers'
import { MessageRow } from './MessageRow'
import { SortableColumn, SortableTable } from './SortableTable'

interface OrderedNamedEntity {
  id: string
  order: number
  name?: string
}

interface DndSortableListTableProps<T extends OrderedNamedEntity> {
  data?: T[]
  columns: SortableColumn[]
  onReorder: (orderedIds: string[]) => Promise<void> | void
  emptyMessage: string
  renderRow: (item: T) => ReactNode
}

export function DndSortableListTable<T extends OrderedNamedEntity>({
  data,
  columns,
  onReorder,
  emptyMessage,
  renderRow,
}: DndSortableListTableProps<T>) {
  const [items, setItems] = useState<T[]>([])
  const [reorderError, setReorderError] = useState<string | null>(null)

  useEffect(() => {
    if (!data) return
    setItems(
      [...data].sort(
        (a, b) =>
          a.order - b.order || (a.name ?? '').localeCompare(b.name ?? '')
      )
    )
  }, [data])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const onDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = items.findIndex(i => i.id === active.id)
    const newIndex = items.findIndex(i => i.id === over.id)
    if (oldIndex < 0 || newIndex < 0) return
    const previous = items
    const reordered = arrayMove(items, oldIndex, newIndex)
    setItems(reordered)
    setReorderError(null)
    try {
      await onReorder(reordered.map(i => i.id))
    } catch (err) {
      console.error(err)
      setItems(previous)
      setReorderError('Nepodařilo se uložit nové pořadí.')
    }
  }

  const fullColumns: SortableColumn[] = [
    { id: '__drag', name: '', notSortable: true, style: { width: '3rem' } },
    ...columns.map(c => ({ ...c, notSortable: true })),
  ]

  return (
    <>
      {reorderError && (
        <div className="alert alert-danger" role="alert">
          {reorderError}
        </div>
      )}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        modifiers={[restrictToVerticalAxis, restrictToParentElement]}
        onDragEnd={onDragEnd}
      >
        <SortableContext
          items={items.map(i => i.id)}
          strategy={verticalListSortingStrategy}
        >
          <SortableTable columns={fullColumns}>
            {data !== undefined && items.length === 0 && (
              <MessageRow message={emptyMessage} colspan={fullColumns.length} />
            )}
            {items.map(item => renderRow(item))}
          </SortableTable>
        </SortableContext>
      </DndContext>
    </>
  )
}
