'use client'

import React, { useEffect, useMemo } from 'react'
import DatePicker from 'react-datepicker'
import {
  Controller,
  UseFormSetError,
  UseFormClearErrors,
} from 'react-hook-form'
import { Label } from '../Label'
import 'react-datepicker/dist/react-datepicker.css'
import { cs } from 'date-fns/locale'

// Helper function to safely parse date strings
const parseDate = (dateString: string | undefined): Date | undefined => {
  if (!dateString) return undefined

  // If it's already in YYYY-MM-DD format, append time
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    const date = new Date(dateString + 'T00:00:00')
    return isNaN(date.getTime()) ? undefined : date
  }

  // Try to parse as-is first
  const date = new Date(dateString)
  return isNaN(date.getTime()) ? undefined : date
}

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
  const parsedMin = parseDate(minDate)
  const parsedMax = parseDate(maxDate)
  const parsedDefaultValue = useMemo(
    () => parseDate(defaultValue),
    [defaultValue]
  )

  // Validate default value on component mount
  useEffect(() => {
    if (parsedDefaultValue && mandatory) {
      clearErrors(id)
    }
  }, [parsedDefaultValue, mandatory, clearErrors, id])

  return (
    <div className="relative w-100">
      <Label id={id} label={label} mandatory={mandatory} />

      <Controller
        control={control}
        name={id}
        defaultValue={defaultValue}
        render={({ field }) => (
          <DatePicker
            id={id}
            // @ts-expect-error: date-fns locale typing conflict
            locale={cs}
            placeholderText="Vyberte datum"
            selected={field.value ? parseDate(field.value) : parsedDefaultValue}
            onChange={date => {
              if (!date || isNaN(date.getTime())) {
                if (mandatory) {
                  setError(id, { message: 'Datum je povinné' })
                }
                return
              }

              clearErrors(id)
              // Format date as YYYY-MM-DD to avoid timezone issues
              const year = date.getFullYear()
              const month = String(date.getMonth() + 1).padStart(2, '0')
              const day = String(date.getDate()).padStart(2, '0')
              field.onChange(`${year}-${month}-${day}`)
            }}
            onSelect={date => {
              if (date) {
                clearErrors(id)
              }
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
