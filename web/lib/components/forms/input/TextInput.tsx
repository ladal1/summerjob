import { type DetailedHTMLProps, type InputHTMLAttributes } from 'react'
import {
  FieldErrors,
  FieldValues,
  UseFormRegisterReturn,
} from 'react-hook-form'
import FormWarning from '../FormWarning'
import { Label } from '../Label'

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
      <Label
        id={id}
        label={label}
        margin={margin}
      />
      <input
        className="form-control smj-input p-0 fs-5"
        {...register()}
        {...rest}
      />
      <FormWarning message={error} />
    </>
  )
}
