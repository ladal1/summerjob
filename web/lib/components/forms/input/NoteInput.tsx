import { type DetailedHTMLProps, type TextareaHTMLAttributes } from 'react'
import { UseFormRegisterReturn } from 'react-hook-form'
import { Label } from './Label'

interface NoteInputProps extends DetailedHTMLProps<
    TextareaHTMLAttributes<HTMLTextAreaElement>,
    HTMLTextAreaElement
  > {
  id: string
  label: string
  register: () => UseFormRegisterReturn
  margin?: boolean
}

export const NoteInput = ({
  id,
  label,
  register,
  margin = true,
  ...rest
}: NoteInputProps) => {
  return (
    <>
      <Label
        id={id}
        label={label}
        margin={margin}
      />
      <textarea
        id={id}
        className="form-control border p-2 fs-5"
        {...register()}
        {...rest}
      />
    </>
  )
}
