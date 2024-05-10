import {
  FieldErrors,
  FieldValues,
  Path,
  UseFormRegister,
  UseFormSetValue,
} from 'react-hook-form'
import { Label } from '../Label'
import React from 'react'
import FormWarning from '../FormWarning'
import { InputActionButton } from '../InputActionButton'

interface TimeInputProps<FormData extends FieldValues> {
  label?: string
  register: UseFormRegister<FormData>
  errors: FieldErrors<FormData>
  setValue: UseFormSetValue<any>
  timeFromId: string
  timeToId: string
  margin?: boolean
}

export const TimeInput = <FormData extends FieldValues>({
  label,
  register,
  errors,
  setValue,
  timeFromId,
  timeToId,
  margin = true,
}: TimeInputProps<FormData>) => {
  const errorTimeFrom = errors?.[timeFromId as Path<FormData>]?.message as
    | string
    | undefined
  const errorTimeTo = errors?.[timeToId as Path<FormData>]?.message as
    | string
    | undefined

  const clearAll = () => {
    setValue(timeFromId, '', { shouldDirty: true, shouldValidate: true })
    setValue(timeToId, '', { shouldDirty: true, shouldValidate: true })
  }

  return (
    <>
      <Label id="timeFrom" label={label} margin={margin} />
      <div className="d-flex justify-content-between align-items-baseline gap-3">
        <div className="d-flex w-50">
          <input
            className="form-control smj-input p-0 fs-5"
            id="timeFrom"
            placeholder="00:00"
            type="time"
            {...register(timeFromId as Path<FormData>)}
          />
          <span className="ps-4 pe-4">-</span>
          <input
            className="form-control smj-input p-0 fs-5"
            id="timeTo"
            placeholder="00:00"
            type="time"
            {...register(timeToId as Path<FormData>)}
          />
        </div>
        <InputActionButton
          className="fas fa-xmark smj-action-delete"
          onClick={clearAll}
          title="Odstranit oba časy"
        />
      </div>
      <FormWarning message={errorTimeFrom || errorTimeTo} />
    </>
  )
}
