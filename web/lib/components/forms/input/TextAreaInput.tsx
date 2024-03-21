import { type DetailedHTMLProps, type TextareaHTMLAttributes } from 'react'
import { FieldErrors, Path, UseFormRegisterReturn } from 'react-hook-form'
import { Label } from '../Label'
import FormWarning from '../FormWarning'

interface TextAreaProps
  extends DetailedHTMLProps<
    TextareaHTMLAttributes<HTMLTextAreaElement>,
    HTMLTextAreaElement
  > {
  id: string
  label: string
  register: () => UseFormRegisterReturn
  errors: FieldErrors<FormData>
  margin?: boolean
}

export const TextAreaInput = ({
  id,
  label,
  register,
  errors,
  margin = true,
  ...rest
}: TextAreaProps) => {
  const error = errors?.[id as Path<FormData>]?.message as string | undefined

  return (
    <>
      <Label id={id} label={label} margin={margin} />
      <textarea
        id={id}
        className="form-control border smj-textarea p-2 fs-5"
        {...register()}
        {...rest}
      />
      <FormWarning message={error} />
    </>
  )
}
