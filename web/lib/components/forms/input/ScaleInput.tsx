import { type DetailedHTMLProps, type InputHTMLAttributes } from 'react'
import { FieldErrors, Path, UseFormRegisterReturn } from 'react-hook-form'
import { Label } from '../Label'
import FormWarning from '../FormWarning'

interface ScaleInputProps {
  id: string
  label: string
  secondaryLabel: string
  min: number
  max: number
  register: () => UseFormRegisterReturn
  errors: FieldErrors<FormData>
}

export const ScaleInput = ({
  id,
  label,
  secondaryLabel,
  min,
  max,
  register,
  errors,
}: ScaleInputProps) => {
  const error = errors?.[id as Path<FormData>]?.message as string | undefined

  return (
    <>
      <Label id={id} label={label} />
      <div className="d-inline-flex justify-content-between allign-items-baseline gap-2">
        {min}
        <input
          id={id}
          type="range"
          className="form-range smj-range"
          min={min}
          max={max}
          {...register()}
        />
        {max}
      </div>
      <div className="text-muted">{secondaryLabel}</div>
      <FormWarning message={error} />
    </>
  )
}
