'use client'
import { UserComplete } from 'lib/types/user'
import { useMemo, useState } from 'react'
import { MessageRow } from '../table/MessageRow'
import RowCategory from '../table/RowCategory'
import {
  SortOrder,
  SortableColumn,
  SortableTable,
} from '../table/SortableTable'
import { sortData } from '../table/SortData'
import UserRow from './UserRow'

const _columns: SortableColumn[] = [
  { id: 'name', name: 'Celé jméno' },
  { id: 'email', name: 'Email' },
  { id: 'permissions', name: 'Oprávnění' },
  {
    id: 'actions',
    name: 'Akce',
    notSortable: true,
  },
]

interface UsersTableProps {
  users: UserComplete[]
  onWorkerUpdated: () => void
}

export default function UsersTable({
  users,
  onWorkerUpdated,
}: UsersTableProps) {
  const [regularUsers, blockedUsers] = useMemo(() => {
    return users.reduce(
      (acc, u) => {
        if (u.blocked) {
          return [acc[0], [...acc[1], u]]
        }
        return [[...acc[0], u], acc[1]]
      },
      [[], []] as [UserComplete[], UserComplete[]]
    )
  }, [users])

  //#region Sort
  const [sortOrder, setSortOrder] = useState<SortOrder>({
    columnId: undefined,
    direction: 'desc',
  })
  const onSortRequested = (direction: SortOrder) => {
    setSortOrder(direction)
  }

  // names has to be same as collumns ids
  const getSortable = useMemo(
    () => ({
      name: (user: UserComplete) => `${user.firstName} ${user.lastName}`,
      email: (user: UserComplete) => user.email,
      permissions: (user: UserComplete) =>
        user.permissions.length > 0 ? user.permissions.join() : 'z',
    }),
    []
  )

  const sortedData = useMemo(() => {
    return regularUsers ? sortData(regularUsers, getSortable, sortOrder) : []
  }, [regularUsers, getSortable, sortOrder])
  //#endregion

  return (
    <SortableTable
      columns={_columns}
      currentSort={sortOrder}
      onRequestedSort={onSortRequested}
    >
      {users.length === 0 && (
        <MessageRow message="Žádní uživatelé" colspan={_columns.length} />
      )}
      {sortedData.map(user => (
        <UserRow key={user.id} user={user} onUpdate={onWorkerUpdated} />
      ))}
      <RowCategory
        title={`Zamčené účty (${blockedUsers.length})`}
        secondaryTitle="Uživatelé se zamčeným účtem se nemohou přihlásit do systému."
        numCols={_columns.length}
        className={'bg-category-hidden'}
      >
        {blockedUsers.map(user => (
          <UserRow key={user.id} user={user} onUpdate={onWorkerUpdated} />
        ))}
      </RowCategory>
    </SortableTable>
  )
}
