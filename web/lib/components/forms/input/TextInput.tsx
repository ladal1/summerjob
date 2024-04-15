import { type DetailedHTMLProps, type InputHTMLAttributes } from 'react'
import { FieldErrors, Path, UseFormRegisterReturn } from 'react-hook-form'
import FormWarning from '../FormWarning'
import { Label } from '../Label'

interface TextInputProps
  extends DetailedHTMLProps<
    InputHTMLAttributes<HTMLInputElement>,
    HTMLInputElement
  > {
  id: string
  label: string
  register: () => UseFormRegisterReturn
  errors: FieldErrors<FormData>
  labelClassName?: string
  margin?: boolean
  mandatory?: boolean
}

export const TextInput = ({
  id,
  label,
  register,
  errors,
  labelClassName = '',
  margin = true,
  mandatory = false,
  ...rest
}: TextInputProps) => {
  const error = errors?.[id as Path<FormData>]?.message

  return (
    <>
      <Label
        id={id}
        label={label}
        className={labelClassName}
        margin={margin}
        mandatory={mandatory}
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
