import { SortOrder } from './SortableTable'

export function sortData(
  data: any[],
  sortable: {
    [b: string]: (item: any) => string | number
  },
  sortOrder: SortOrder
) {
  if (sortOrder.columnId === undefined) {
    return data
  }
  data = [...data]

  if (sortOrder.columnId in sortable) {
    const sortKey = sortable[sortOrder.columnId]
    return data.sort((a, b) => {
      if (sortKey(a) < sortKey(b)) {
        return sortOrder.direction === 'desc' ? 1 : -1
      }
      if (sortKey(a) > sortKey(b)) {
        return sortOrder.direction === 'desc' ? -1 : 1
      }
      return 0
    })
  }
  return data
}
