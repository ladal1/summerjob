import { UseFormRegisterReturn } from 'react-hook-form'

export default function ButtonGroup({
  groupId,
  id,
  name,
  register,
}: {
  groupId: string
  id: string
  name: string
  register: () => UseFormRegisterReturn
}) {
  const fullId = `${groupId}-${id}`

  return (
    <div className="d-inline-block me-3">
      <input
        id={fullId}
        className="btn-check"
        type="checkbox"
        value={id}
        {...register()}
      />
      <label
        className="form-label btn btn-allergy-select btn-light p-2"
        htmlFor={fullId}
      >
        {name}
      </label>
    </div>
  )
}
