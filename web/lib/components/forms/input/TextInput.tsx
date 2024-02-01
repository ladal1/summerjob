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
  margin?: boolean
  isNumber?: boolean
}

export const TextInput = <FormData extends FieldValues>({
  id,
  label,
  errors,
  register,
  margin = true,
  isNumber = false,
  ...rest
}: TextInputProps<FormData>) => {
  const error = errors?.[id]?.message as string | undefined

  return (
    <>
      <label
        className={'form-label fw-bold' + (margin ? ' mt-4' : '')}
        htmlFor={id}
      >
        {label}
      </label>
      <input
        className="form-control p-0 fs-5"
        {...register(id, { valueAsNumber: isNumber })}
        {...rest}
      />
      <FormWarning message={error} />
    </>
  )
}
