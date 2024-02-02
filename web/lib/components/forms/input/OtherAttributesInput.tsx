import { FieldValues, Path, UseFormRegister } from 'react-hook-form'

interface OtherAttributesInputProps<FormData extends FieldValues> {
  label: string
  register: UseFormRegister<FormData>
}

export const OtherAttributesInput = <FormData extends FieldValues>({
  label,
  register,
}: OtherAttributesInputProps<FormData>) => {
  return (
    <>
      <label className="form-label d-block fw-bold mt-4">{label}</label>
      <div className="form-check align-self-center align-items-center d-flex gap-2">
        <input
          type="checkbox"
          className="form-check-input smj-checkbox"
          id="strong"
          {...register('strong' as Path<FormData>)}
        />
        <label className="form-check-label" htmlFor="strong">
          Silák
          <i className="fas fa-dumbbell ms-2"></i>
        </label>
      </div>
    </>
  )
}
