import { type DetailedHTMLProps, type InputHTMLAttributes } from 'react'
import {
  FieldErrors,
  FieldValues,
  Path,
  UseFormRegister,
} from 'react-hook-form'
import FormWarning from '../FormWarning'

interface TextInputProps<FormData extends FieldValues>
  extends DetailedHTMLProps<
    InputHTMLAttributes<HTMLInputElement>,
    HTMLInputElement
  > {
  id: Path<FormData>
  label: string
  register: UseFormRegister<FormData>
  errors: FieldErrors<FormData>
}

export const TextInput = <FormData extends FieldValues>({
  id,
  label,
  errors,
  register,
  ...rest
}: TextInputProps<FormData>) => {
  const error = errors?.[id]?.message as string | undefined

  return (
    <>
      <label className="form-label fw-bold mt-4" htmlFor={id}>
        {label}
      </label>
      <input className="form-control p-0 fs-5" {...register(id)} {...rest} />
      <FormWarning message={error} />
    </>
  )
}
