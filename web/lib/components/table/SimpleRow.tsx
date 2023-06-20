interface RowProps {
  data: any[]
  draggable?: boolean
  onDragStart?: (e: React.DragEvent<HTMLTableRowElement>) => void
}

export function SimpleRow({ data, draggable = false, onDragStart }: RowProps) {
  const style = draggable ? { cursor: 'grab' } : {}
  return (
    <tr draggable={draggable} style={style} onDragStart={onDragStart}>
      {data.map((field, index) => {
        return (
          <td
            className="text-truncate"
            key={index}
            title={typeof field === 'string' ? field : undefined}
          >
            {field}
          </td>
        )
      })}
    </tr>
  )
}
