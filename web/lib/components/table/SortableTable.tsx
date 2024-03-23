export interface SortableColumn {
  id: string
  name: string
  sortable: boolean
}

export interface SortOrder {
  columnId: string | undefined
  direction: 'asc' | 'desc'
}

interface SortableTableProps {
  columns: SortableColumn[]
  children: React.ReactNode
  currentSort: SortOrder
  onRequestedSort: (direction: SortOrder) => void
}

export function SortableTable({
  columns,
  children,
  currentSort,
  onRequestedSort,
}: SortableTableProps) {
  const onSortClicked = (columnId: string) => {
    if (currentSort.columnId === columnId) {
      onRequestedSort(
        currentSort.direction === 'asc'
          ? { columnId: columnId, direction: 'desc' }
          : { columnId: undefined, direction: 'asc' }
      )
    } else {
      onRequestedSort({ columnId: columnId, direction: 'asc' })
    }
  }

  const sortIcon = (columnId: string) => {
    let direction
    if (currentSort.columnId === columnId) {
      direction =
        currentSort.direction === 'desc' ? 'fa-sort-down' : 'fa-sort-up'
    } else {
      direction = 'fa-sort'
    }
    const color = currentSort.columnId !== columnId ? 'sort-inactive' : ''
    return <i className={`fas ${direction} ms-2 ${color}`}></i>
  }

  return (
    <div className="table-responsive text-nowrap mb-2 smj-shadow rounded-3">
      <table className="table mb-0">
        <thead className="smj-table-header">
          <tr>
            {columns.map(column => (
              <th
                key={column.id}
                onClick={() => onSortClicked(column.id)}
                className={column.sortable ? 'cursor-pointer' : ''}
              >
                {column.name}
                {column.sortable && sortIcon(column.id)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="smj-table-body mb-0">{children}</tbody>
      </table>
    </div>
  )
}
