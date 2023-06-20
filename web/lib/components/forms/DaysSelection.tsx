import { capitalizeFirstLetter, formatDateShort } from 'lib/helpers/helpers'
import React from 'react'
import { UseFormRegisterReturn } from 'react-hook-form'

interface DaysSelectionProps {
  name: string
  days: Date[]
  register: () => UseFormRegisterReturn
}

export default function DaysSelection({
  name,
  days,
  register,
}: DaysSelectionProps) {
  return (
    <div
      className="btn-group"
      role="group"
      aria-label="Select from available days"
    >
      {days.map(day => (
        <React.Fragment key={day.toJSON()}>
          <input
            type="checkbox"
            className="btn-check"
            id={`${name}-${day.toJSON()}`}
            autoComplete="off"
            {...register()}
            value={day.toJSON()}
          />
          <label
            className="btn btn-day-select p-2 pe-3 ps-3"
            htmlFor={`${name}-${day.toJSON()}`}
          >
            {capitalizeFirstLetter(formatDateShort(day))}
          </label>
        </React.Fragment>
      ))}
    </div>
  )
}
