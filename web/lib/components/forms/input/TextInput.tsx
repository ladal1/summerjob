import { type DetailedHTMLProps, type InputHTMLAttributes } from 'react'
import {
  FieldErrors,
  FieldValues,
  UseFormRegisterReturn,
} from 'react-hook-form'
import FormWarning from '../FormWarning'

interface TextInputProps<FormData extends FieldValues>
  extends DetailedHTMLProps<
    InputHTMLAttributes<HTMLInputElement>,
    HTMLInputElement
  > {
  id: string
  label: string
  register: () => UseFormRegisterReturn
  errors: FieldErrors<FormData>
  margin?: boolean
}

export const TextInput = <FormData extends FieldValues>({
  id,
  label,
  register,
  errors,
  margin = true,
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
        {...register()}
        {...rest}
      />
      <FormWarning message={error} />
    </>
  )
}
