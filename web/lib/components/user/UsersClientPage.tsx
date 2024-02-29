'use client'

import { useAPIUsers } from 'lib/fetcher/user'
import { Permission } from 'lib/types/auth'
import { Serialized } from 'lib/types/serialize'
import { deserializeUsers, UserComplete } from 'lib/types/user'
import { useState, useMemo } from 'react'
import ErrorPage from '../error-page/ErrorPage'
import UsersTable from './UsersTable'
import { Filters } from '../filters/Filters'

interface UsersClientPageProps {
  sUsers: Serialized
}

export default function UsersClientPage({ sUsers }: UsersClientPageProps) {
  const inititalUsers = deserializeUsers(sUsers)
  const { data, error, mutate } = useAPIUsers({
    fallbackData: inititalUsers,
  })
  const sortedAlphabetically = useMemo(() => {
    if (!data) return []
    return data.sort((a, b) => {
      const aName = a.lastName + a.firstName
      const bName = b.lastName + b.firstName
      return aName.localeCompare(bName)
    })
  }, [data])
  const permissions = useMemo(() => getPermissions(), [])

  const [filter, setFilter] = useState('')
  const [filterPermission, setFilterPermission] =
    useState(permissions[0])

  const fulltextData = useMemo(() => getFulltextData(data), [data])
  const filteredData = useMemo(
    () =>
      filterUsers(
        filter,
        fulltextData,
        Permission[filterPermission.id as keyof typeof Permission],
        sortedAlphabetically
      ),
    [fulltextData, filter, filterPermission, sortedAlphabetically]
  )

  const permissionSelectChanged = (id: string) => {
    setFilterPermission(permissions.find(p => p.id === id) || permissions[0])
  }

  if (error && !data) {
    return <ErrorPage error={error} />
  }

  return (
    <section>
      <div className="container">
        <div className="row">
          <div className="col">
            <Filters
              search={filter}
              onSearchChanged={setFilter}
              selects={[
                {
                  id: 'permission',
                  options: permissions,
                  selected: filterPermission,
                  onSelectChanged: permissionSelectChanged,
                  defaultOptionId: 'all'
                },
              ]}
            />
          </div>
        </div>
        <div className="row">
          <div className="col-12">
            <UsersTable users={filteredData || []} onWorkerUpdated={mutate} />
          </div>
        </div>
      </div>
    </section>
  )
}

function getFulltextData(users?: UserComplete[]) {
  const map = new Map<string, string>()
  users?.forEach(user => {
    map.set(
      user.id,
      (user.firstName + user.lastName + user.email).toLocaleLowerCase()
    )
  })
  return map
}

function getPermissions() {
  const perms = [{ id: 'all', name: 'Vyberte oprávnění' }]
  for (const perm of Object.values(Permission)) {
    perms.push({ id: perm, name: perm })
  }
  return perms
}

function filterUsers(
  text: string,
  searchable: Map<string, string>,
  withPermission?: Permission,
  users?: UserComplete[]
) {
  if (!users) return []
  return users
    .filter(w => {
      if (text.length > 0) {
        return searchable.get(w.id)?.includes(text.toLowerCase()) ?? true
      }
      return true
    })
    .filter(w => {
      if (withPermission) {
        return w.permissions.includes(withPermission)
      }
      return true
    })
}
