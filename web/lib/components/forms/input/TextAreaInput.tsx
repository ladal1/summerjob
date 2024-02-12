import { type DetailedHTMLProps, type TextareaHTMLAttributes } from 'react'
import { UseFormRegisterReturn } from 'react-hook-form'
import { Label } from '../Label'

interface TextAreaProps extends DetailedHTMLProps<
    TextareaHTMLAttributes<HTMLTextAreaElement>,
    HTMLTextAreaElement
  > {
  id: string
  label: string
  register: () => UseFormRegisterReturn
  margin?: boolean
}

export const TextAreInput = ({
  id,
  label,
  register,
  margin = true,
  ...rest
}: TextAreaProps) => {
  return (
    <>
      <Label
        id={id}
        label={label}
        margin={margin}
      />
      <textarea
        id={id}
        className="form-control border smj-textarea p-2 fs-5"
        {...register()}
        {...rest}
      />
    </>
  )
}
