import { type DetailedHTMLProps, type InputHTMLAttributes } from 'react'
import {
  FieldErrors,
  FieldValues,
  Path,
  UseFormRegister,
} from 'react-hook-form'
import FormWarning from '../FormWarning'

interface DateInputProps<FormData extends FieldValues>
  extends DetailedHTMLProps<
    InputHTMLAttributes<HTMLInputElement>,
    HTMLInputElement
  > {
  id: Path<FormData>
  label: string
  register: UseFormRegister<FormData>
  errors: FieldErrors<FormData>
}

export const DateInput = <FormData extends FieldValues>({
  id,
  label,
  errors,
  register,
  ...rest
}: DateInputProps<FormData>) => {
  const error = errors?.[id]?.message as string | undefined

  return (
    <>
      <label className="form-label fw-bold mt-4 d-block d-md-none" htmlFor={id}>
        {label}
      </label>
      <input
        className="form-control p-1 fs-5"
        {...register(id, { valueAsDate: true })}
        {...rest}
      />
      <FormWarning message={error} />
    </>
  )
}