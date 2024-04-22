import { priorityMapping } from 'lib/data/enumMapping/priorityMapping'
import { useState } from 'react'
import { FieldErrors, Path } from 'react-hook-form'
import FormWarning from '../FormWarning'
import { Label } from '../Label'

interface ScaleInputProps {
  id: string
  label: string
  min: number
  max: number
  init?: number
  registerPriority: (num: number) => void
  errors: FieldErrors<FormData>
}

export const ScaleInput = ({
  id,
  label,
  min,
  max,
  init = 1,
  registerPriority,
  errors,
}: ScaleInputProps) => {
  const error = errors?.[id as Path<FormData>]?.message as string | undefined
  const [val, setVal] = useState(init)
  const setValue = (num: number) => {
    setVal(num)
    registerPriority(num)
  }
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
          value={val}
          onChange={e => {
            setValue(+e.target.value)
          }}
        />
        {max}
      </div>

      <div className="text-muted">{priorityMapping[val]}</div>
      <FormWarning message={error} />
    </>
  )
}
