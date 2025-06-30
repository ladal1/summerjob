import { CSSProperties, useRef, useEffect } from 'react'

export interface SortableColumn {
  id: string
  name: string
  notSortable?: boolean
  className?: string
  style?: CSSProperties
  stickyRight?: boolean
}

export interface SortOrder {
  columnId: string | undefined
  direction: 'asc' | 'desc'
}

interface SortableTableProps {
  columns: SortableColumn[]
  children: React.ReactNode
  currentSort?: SortOrder
  onRequestedSort?: (direction: SortOrder) => void
}

export function SortableTable({
  columns,
  children,
  currentSort,
  onRequestedSort,
}: SortableTableProps) {
  const tableContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const checkScrollable = () => {
      const container = tableContainerRef.current
      if (container) {
        const isScrollable = container.scrollWidth > container.clientWidth
        if (isScrollable) {
          container.classList.add('is-scrollable')
        } else {
          container.classList.remove('is-scrollable')
        }
      }
    }

    // Check on mount and when window resizes
    checkScrollable()
    window.addEventListener('resize', checkScrollable)

    return () => {
      window.removeEventListener('resize', checkScrollable)
    }
  }, [children]) // Re-check when table content changes

  const onSortClicked = (columnId: string) => {
    if (currentSort === undefined || onRequestedSort === undefined) {
      return
    } else if (currentSort.columnId === columnId) {
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
    if (currentSort === undefined) {
      return <></>
    }
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
    <div ref={tableContainerRef} className="table-responsive mb-2 smj-shadow rounded-3">
      <table className="table  mb-0">
        <thead className="smj-table-header text-nowrap">
          <tr>
            {columns.map(column => (
              <th
                key={column.id}
                onClick={() => onSortClicked(column.id)}
                className={`
                  ${column.notSortable ? '' : 'cursor-pointer'} ${
                  column.stickyRight
                    ? 'smj-sticky-col-right smj-table-header'
                    : ''
                } ${column.className ? column.className : ''}
                `}
                style={column.style}
              >
                {column.name}
                {!column.notSortable && sortIcon(column.id)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="mb-0">{children}</tbody>
      </table>
    </div>
  )
}
