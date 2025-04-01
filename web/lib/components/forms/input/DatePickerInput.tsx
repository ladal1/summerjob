'use client'

import React from 'react'
import DatePicker from 'react-datepicker'
import {
  Controller,
  UseFormSetError,
  UseFormClearErrors,
} from 'react-hook-form'
import { Label } from '../Label'
import 'react-datepicker/dist/react-datepicker.css'
import { cs } from 'date-fns/locale'

interface DatePickerInputProps {
  id: string
  label: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  errors?: any
  mandatory?: boolean
  minDate?: string
  maxDate?: string
  defaultValue?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setError: UseFormSetError<any>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  clearErrors: UseFormClearErrors<any>
}

export function DatePickerInput({
  id,
  label,
  control,
  errors,
  mandatory = false,
  minDate,
  maxDate,
  defaultValue,
  setError,
  clearErrors,
}: DatePickerInputProps) {
  const parsedMin = minDate ? new Date(minDate) : undefined
  const parsedMax = maxDate ? new Date(maxDate) : undefined
  const parsedDefaultValue = defaultValue ? new Date(defaultValue) : undefined

  return (
    <div className="relative w-100">
      <Label id={id} label={label} mandatory={mandatory} />

      <Controller
        control={control}
        name={id}
        render={({ field }) => (
          <DatePicker
            id={id}
            // @ts-expect-error: date-fns locale typing conflict
            locale={cs}
            placeholderText="Vyberte datum"
            selected={field.value ? new Date(field.value) : parsedDefaultValue}
            onChange={date => {
              if (!date) {
                setError(id, { message: 'Datum je povinné' })
                return
              }

              clearErrors(id)
              field.onChange(date.toISOString())
            }}
            dateFormat="dd.MM.yyyy"
            minDate={parsedMin}
            maxDate={parsedMax}
            className="form-control smj-input p-0 w-100"
            showPopperArrow={false}
            autoComplete="off"
          />
        )}
      />

      {errors?.[id] && (
        <p className="text-danger text-sm mt-1">{errors[id].message}</p>
      )}
    </div>
  )
}
