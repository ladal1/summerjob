import { ChangeEvent } from 'react'

export interface UsersFiltersPermission {
  id: string
  name: string
}

interface UsersFiltersProps {
  search: string
  onSearchChanged: (search: string) => void
  permissions: UsersFiltersPermission[]
  selectedPermission: UsersFiltersPermission
  onPermissionSelected: (id: string) => void
}

export function UsersFilters({
  search,
  onSearchChanged,
  permissions,
  selectedPermission,
  onPermissionSelected,
}: UsersFiltersProps) {
  const permissionSelectChanged = (e: ChangeEvent<HTMLSelectElement>) => {
    onPermissionSelected(e.target.value)
  }

  const isDefaultPermissionSelected =
    selectedPermission.id === permissions[0].id

  return (
    <>
      <div className="row">
        <div className="col-auto mb-3">
          <input
            type="text"
            className="p-2 d-inline-block outline-none border-0 smj-filter-input"
            placeholder="Vyhledat..."
            value={search}
            onChange={e => onSearchChanged(e.target.value)}
          />
        </div>
        <div className="col-auto mb-3">
          <div className="d-inline-block">
            <select
              name="permission"
              id="permission"
              className={`form-select p-2 bg-white smj-filter-input ${
                isDefaultPermissionSelected ? 'smj-default-option' : ''
              }`}
              value={selectedPermission.id}
              onChange={permissionSelectChanged}
            >
              {permissions &&
                permissions.map(permission => (
                  <option value={permission.id} key={permission.id}>
                    {permission.name}
                  </option>
                ))}
            </select>
          </div>
        </div>
      </div>
    </>
  )
}
