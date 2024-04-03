import { UseFormRegisterReturn } from 'react-hook-form'

export default function ButtonGroup({
  id,
  name,
  register,
}: {
  id: string
  name: string
  register: () => UseFormRegisterReturn
}) {
  return (
    <div className="d-inline-block me-3">
      <input
        id={id}
        className="btn-check"
        type="checkbox"
        value={id}
        {...register()}
      />
      <label
        className="form-label btn btn-allergy-select btn-light p-2"
        htmlFor={id}
      >
        {name}
      </label>
    </div>
  )
}
