import { normalizeString } from 'lib/helpers/helpers'
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
      const keyA =
        typeof sortKey(a) === 'string'
          ? normalizeString(sortKey(a) as string)
          : sortKey(a)
      const keyB =
        typeof sortKey(b) === 'string'
          ? normalizeString(sortKey(b) as string)
          : sortKey(b)
      if (keyA < keyB) {
        return sortOrder.direction === 'desc' ? 1 : -1
      }
      if (keyA > keyB) {
        return sortOrder.direction === 'desc' ? -1 : 1
      }
      return 0
    })
  }
  return data
}
