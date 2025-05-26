import { UseFormRegisterReturn } from 'react-hook-form'

export const CheckboxInput = ({
  id,
  label,
  register,
}: {
  id: string
  label: string
  register: () => UseFormRegisterReturn
}) => (
  <div className="d-inline-block me-3">
    <input id={id} className="btn-check" type="checkbox" {...register()} />
    <label
      className="form-label btn btn-allergy-select btn-light p-2"
      htmlFor={id}
    >
      {label}
    </label>
  </div>
)
