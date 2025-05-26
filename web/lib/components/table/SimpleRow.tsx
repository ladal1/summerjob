import { RowCells } from './RowCells'

interface RowProps {
  data: RowCells[]
  draggable?: boolean
  className?: string
  onDragStart?: (e: React.DragEvent<HTMLTableRowElement>) => void
  onMouseEnter?: () => void
  onMouseLeave?: () => void
}

export function SimpleRow({
  data,
  draggable = false,
  onDragStart,
   
  onMouseEnter = () => {},
  onMouseLeave = () => {},
}:  
RowProps) {
  const style = draggable ? { cursor: 'grab' } : {}
  return (
    <tr
      draggable={draggable}
      style={style}
      onDragStart={onDragStart}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className="smj-table-body"
    >
      {data.map((field, index) => {
        return (
          <td
            className={`text-truncate ${
              field.stickyRight ? 'smj-sticky-col-right smj-table-body' : ''
            }`}
            key={index}
            title={typeof field === 'string' ? field : undefined}
          >
            {field.content}
          </td>
        )
      })}
    </tr>
  )
}
