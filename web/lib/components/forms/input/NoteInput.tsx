import { type DetailedHTMLProps, type TextareaHTMLAttributes } from 'react'
import { FieldValues, Path, UseFormRegister } from 'react-hook-form'

interface NoteInputProps<FormData extends FieldValues>
  extends DetailedHTMLProps<
    TextareaHTMLAttributes<HTMLTextAreaElement>,
    HTMLTextAreaElement
  > {
  id: Path<FormData>
  label: string
  register: UseFormRegister<FormData>
  margin?: boolean
}

export const NoteInput = <FormData extends FieldValues>({
  id,
  label,
  register,
  margin = true,
  ...rest
}: NoteInputProps<FormData>) => {
  return (
    <>
      <label
        className={'form-label fw-bold' + (margin ? ' mt-4' : '')}
        htmlFor={id}
      >
        {label}
      </label>
      <textarea
        id={id}
        className="form-control border p-2 fs-5"
        {...register(id)}
        {...rest}
      />
    </>
  )
}
