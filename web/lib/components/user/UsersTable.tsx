'use client'
import { UserComplete } from 'lib/types/user'
import { useMemo } from 'react'
import { MessageRow } from '../table/MessageRow'
import RowCategory from '../table/RowCategory'
import UserRow from './UserRow'

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
  return (
    <div className="table-responsive text-nowrap mb-2 smj-shadow rounded-3">
      <table className="table table-hover mb-0">
        <thead className="smj-table-header">
          <tr>
            {_columns.map(column => (
              <th key={column}>{column}</th>
            ))}
          </tr>
        </thead>
        <tbody className="smj-table-body mb-0">
          {users.length === 0 && (
            <MessageRow message="Žádní uživatelé" colspan={_columns.length} />
          )}
          {regularUsers.map(user => (
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
        </tbody>
      </table>
    </div>
  )
}

const _columns = ['Celé jméno', 'Email', 'Oprávnění', 'Akce']
