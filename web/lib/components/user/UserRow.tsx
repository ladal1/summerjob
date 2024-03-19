'use client'
import { useAPIUserUpdate } from 'lib/fetcher/user'
import { UserComplete } from 'lib/types/user'
import { SimpleRow } from '../table/SimpleRow'
import { EditIcon } from './EditIcon'
import { LockIcon } from './LockIcon'

interface UserRowProps {
  user: UserComplete
  onUpdate: () => void
}

export default function UserRow({ user, onUpdate }: UserRowProps) {
  const { trigger, error } = useAPIUserUpdate(user.id, {
    onSuccess: () => onUpdate(),
  })
  const toggleLocked = () => {
    trigger({ blocked: !user.blocked })
  }

  return <SimpleRow data={formatUserRow(user, toggleLocked, onUpdate)} />
}

function formatUserRow(
  user: UserComplete,
  toggleLocked: () => void,
  onUserEdited: () => void
) {
  const permissions = user.permissions
  const permissionString = permissions.join(', ')
  return [
    { content: `${user.lastName}, ${user.firstName}` },
    { content: user.email },
    { content: permissionString },
    {
      content: (
        <span
          key={`actions-${user.id}`}
          className="d-flex align-items-center gap-3"
        >
          <EditIcon onEdited={onUserEdited} user={user} />
          <LockIcon locked={user.blocked} onConfirm={toggleLocked} />
        </span>
      ),
    },
  ]
}
