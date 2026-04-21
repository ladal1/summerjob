import { CSSProperties } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { RowCells } from './RowCells'

interface DndSortableRowProps {
  id: string
  data: RowCells[]
}

export function DndSortableRow({ id, data }: DndSortableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    background: isDragging ? 'var(--bs-light)' : undefined,
  }

  return (
    <tr ref={setNodeRef} style={style} className="smj-table-body">
      <td
        {...attributes}
        {...listeners}
        style={{ cursor: 'grab', userSelect: 'none', width: '3rem' }}
        className="text-center text-muted"
        aria-label="Přetáhnout pro změnu pořadí"
      >
        <i className="fas fa-grip-vertical"></i>
      </td>
      {data.map((field, index) => (
        <td
          key={index}
          className={`text-truncate ${
            field.stickyRight ? 'smj-sticky-col-right smj-table-body' : ''
          }`}
          title={typeof field.content === 'string' ? field.content : undefined}
        >
          {field.content}
        </td>
      ))}
    </tr>
  )
}
