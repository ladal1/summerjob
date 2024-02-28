import { zodResolver } from '@hookform/resolvers/zod'
import { useAPIUserUpdate } from 'lib/fetcher/user'
import { Permission } from 'lib/types/auth'
import { UserComplete, UserUpdateData, UserUpdateSchema } from 'lib/types/user'
import { useForm } from 'react-hook-form'
import ErrorMessageModal from '../modal/ErrorMessageModal'

interface EditUserProps {
  user: UserComplete
  onUpdate: () => void
}

export default function EditUserForm({ user, onUpdate }: EditUserProps) {
  const { trigger, error, isMutating, reset } = useAPIUserUpdate(user.id, {
    onSuccess: () => onUpdate(),
  })
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UserUpdateData>({
    resolver: zodResolver(UserUpdateSchema),
    defaultValues: {
      permissions: user.permissions,
    },
  })

  const onSubmit = (data: UserUpdateData) => {
    trigger(data)
  }

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} autoComplete="off">
        <div className="fs-5 mb-3">
          {user.firstName} {user.lastName}
        </div>
        <p className="text-muted">
          Uživatelé s rolí ADMIN mají automaticky přístup ke všem stránkám.
        </p>
        <div className="mb-3">
          {Object.values(Permission).map(permission => (
            <label
              className="d-flex align-items-center gap-2"
              key={`label-${permission}`}
            >
              <input
                type="checkbox"
                value={permission}
                className="form-check-input fs-5 smj-checkbox"
                {...register('permissions')}
              />{' '}
              <span className="d-inline-block fs-5">{permission}</span>
            </label>
          ))}
        </div>
        <input
          type={'submit'}
          className="btn btn-primary float-end pt-2 pb-2"
          value={'Uložit'}
          disabled={isMutating}
        />
      </form>
      {error && <ErrorMessageModal onClose={reset} />}
    </>
  )
}
