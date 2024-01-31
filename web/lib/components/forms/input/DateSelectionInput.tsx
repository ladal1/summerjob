import { FieldValues, Path, UseFormRegister } from 'react-hook-form'
import DateSelection from '../DateSelection'
import { DetailedHTMLProps, InputHTMLAttributes } from 'react'

interface DateSelectionInputProps<FormData extends FieldValues>
  extends DetailedHTMLProps<
    InputHTMLAttributes<HTMLInputElement>,
    HTMLInputElement
  > {
  id: Path<FormData>
  label: string
  register: UseFormRegister<FormData>
  days: Date[]
}

export const DateSelectionInput = <FormData extends FieldValues>({
  id,
  label,
  register,
  days,
}: DateSelectionInputProps<FormData>) => {
  return (
    <>
      <label className="form-label d-block fw-bold mt-4" htmlFor={id}>
        {label}
      </label>
      <DateSelection name={id} days={days} register={() => register(id)} />
    </>
  )
}
