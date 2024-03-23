interface RowProps {
  data: any[]
  draggable?: boolean
  onDragStart?: (e: React.DragEvent<HTMLTableRowElement>) => void
  onMouseEnter?: () => void
  onMouseLeave?: () => void
}

export function SimpleRow({
  data,
  draggable = false,
  onDragStart,
  /* eslint-disable @typescript-eslint/no-empty-function */
  onMouseEnter = () => {},
  onMouseLeave = () => {},
}: /* eslint-enable @typescript-eslint/no-empty-function */
RowProps) {
  const style = draggable ? { cursor: 'grab' } : {}
  return (
    <tr
      draggable={draggable}
      style={style}
      onDragStart={onDragStart}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
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
