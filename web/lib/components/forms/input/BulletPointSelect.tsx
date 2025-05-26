import { useState } from 'react'
import {
  FieldErrors,
  UseFormSetValue,
  UseFormGetValues,
  UseFormSetError,
  UseFormClearErrors,
  UseFormRegisterReturn,
} from 'react-hook-form'
import { Label } from '../Label'

interface Option {
  value: number
  label: string
}

interface BulletPointSelectProps {
  id: string
  label: string
  options: Option[]
  register: () => UseFormRegisterReturn
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setValue: UseFormSetValue<any>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getValues: UseFormGetValues<any>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  errors: FieldErrors<any>
  mandatory?: boolean
  minCustomValue: number
  labelClassName?: string
  margin?: boolean
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setError: UseFormSetError<any>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  clearErrors: UseFormClearErrors<any>
}

export const BulletPointSelect = ({
  id,
  label,
  options,
  register,
  setValue,
  setError,
  clearErrors,
  errors,
  labelClassName = '',
  margin,
  mandatory = false,
  minCustomValue,
}: BulletPointSelectProps) => {
  const [customValue, setCustomValue] = useState<string>('')
  const [textInput, setTextInput] = useState<boolean>(false)

  return (
    <div className="d-flex flex-column gap-2">
      <Label
        id={id}
        label={label}
        className={labelClassName}
        margin={margin}
        mandatory={mandatory}
      />

      {/* Standardní možnosti */}
      {options.map(option => (
        <label key={option.value} className="d-flex align-items-center gap-2">
          <input
            type="radio"
            {...register()}
            value={option.value.toString()}
            onChange={e => {
              setValue(id, e.target.value)
              setTextInput(false)
            }}
          />
          {option.label}
        </label>
      ))}

      {/* custom input */}
      <label className="d-flex align-items-center gap-2">
        <input
          type="radio"
          {...register()}
          value="custom"
          checked={textInput}
          onChange={() => {
            setTextInput(true)
          }}
        />
        <input
          type="number"
          className="form-control smj-input p-0 fs-5 custom-input"
          placeholder="Vlastní částka (větší než 1 600 Kč)"
          onFocus={() => {
            setTextInput(true)
          }}
          value={customValue}
          onChange={e => {
            const value = e.target.value
            setTextInput(true)

            setCustomValue(value)
            if (value && parseInt(value) < minCustomValue) {
              setError(id, {
                type: 'manual',
                message: `Částka musí být minimálně ${minCustomValue} Kč`,
              })
            } else {
              clearErrors(id)
              setValue(id, value)
            }
          }}
        />
      </label>

      {(errors[id]?.message as string) === 'Expected string, received null' && (
        <p className="text-danger">Toto pole je povinné</p>
      )}

      {errors[id] &&
        (errors[id]?.message as string) != 'Expected string, received null' && (
          <p className="text-danger">{errors[id]?.message as string}</p>
        )}
    </div>
  )
}
