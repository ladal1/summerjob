import { type DetailedHTMLProps, type InputHTMLAttributes } from 'react'
import {
  FieldErrors,
  FieldValues,
  UseFormRegisterReturn,
} from 'react-hook-form'
import FormWarning from '../FormWarning'
import { Label } from './Label'

interface DateInputProps<FormData extends FieldValues>
  extends DetailedHTMLProps<
    InputHTMLAttributes<HTMLInputElement>,
    HTMLInputElement
  > {
  id: string
  label: string
  register: () => UseFormRegisterReturn
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
      <Label
        id={id}
        label={label}
        mdNone={true}
      />
      <input
        className="form-control p-1 fs-5"
        {...register()}
        {...rest}
      />
      <FormWarning message={error} />
    </>
  )
}
