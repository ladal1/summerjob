import { DateBool } from 'lib/data/dateSelectionType'
import { getWeekdayNames } from 'lib/helpers/helpers'
import React, { useCallback, useEffect, useState } from 'react'
import { UseFormRegisterReturn, UseFormSetValue } from 'react-hook-form'
import CallSMJTeamModal from '../modal/CallSMJTeamModal'

interface DateSelectionProps {
  name: string
  days: DateBool[][]
  disableAfter?: number
  register: () => UseFormRegisterReturn
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setValue?: UseFormSetValue<any>
  watch?: (name: string) => unknown
  allowSpecialButtons: boolean
}

export default function DateSelection({
  name,
  days,
  disableAfter = undefined,
  register,
  setValue,
  watch,
  allowSpecialButtons,
}: DateSelectionProps) {
  const weekDays = getWeekdayNames()

  const makeWeekKey = (week: DateBool[]): string => {
    const start = week[0].date
    const end = week[week.length - 1].date
    return start.toJSON() + '-' + end.toJSON()
  }

  const getCurrentValue = (): string[] => {
    const val = watch?.(name)
    return Array.isArray(val) ? (val as string[]) : []
  }

  const selectedCount = getCurrentValue().length

  //#region Disable date button

  const [currentDate] = useState<Date>(() => new Date())
  const [tomorrowDate] = useState<Date>(() => {
    const tomorrow = new Date(currentDate.getTime())
    tomorrow.setDate(currentDate.getDate() + 1)
    return tomorrow
  })

  const isAfterHoursCalc = useCallback(() => {
    if (!disableAfter) return false
    const currentHour = currentDate.getHours()
    return currentHour >= disableAfter
  }, [currentDate, disableAfter])

  const [isAfterHours, setIsAfterHours] = useState<boolean>(isAfterHoursCalc())

  useEffect(() => {
    setIsAfterHours(isAfterHoursCalc())
  }, [disableAfter, isAfterHoursCalc])

  const isDateRightAfterNow = (date: Date): boolean => {
    return date.getDate() === tomorrowDate.getDate()
  }

  const isToday = (date: Date): boolean => {
    return (
      date.getDate() === currentDate.getDate() &&
      date.getMonth() === currentDate.getMonth() &&
      date.getFullYear() === currentDate.getFullYear()
    )
  }

  const isDateDisabledDueToAfterHours = (date: Date) => {
    return isAfterHours && isDateRightAfterNow(date)
  }

  const [showCallModal, setShowCallModal] = useState(false)

  //#endregion

  //#region Special buttons

  const clearAll = () => {
    if (setValue === undefined) {
      return
    }
    setValue(name, [], { shouldDirty: true, shouldValidate: true })
  }

  const selectAll = () => {
    if (setValue === undefined) {
      return
    }
    const allSelectedDays = days
      .flat()
      .filter(
        day => !day.isDisabled && !isDateDisabledDueToAfterHours(day.date)
      )
      .map(day => day.date.toJSON())
    setValue(name, allSelectedDays, { shouldDirty: true, shouldValidate: true })
  }

  const toggleWeekday = (weekdayIndex: number) => {
    if (setValue === undefined) {
      return
    }
    const currentValue = getCurrentValue()
    const weekdayDays = days
      .map(week => week[weekdayIndex])
      .filter(
        day => !day.isDisabled && !isDateDisabledDueToAfterHours(day.date)
      )
    const weekdayDateStrings = weekdayDays.map(d => d.date.toJSON())
    const allSelected = weekdayDateStrings.every(d => currentValue.includes(d))
    if (allSelected) {
      const newValue = currentValue.filter(d => !weekdayDateStrings.includes(d))
      setValue(name, newValue, { shouldDirty: true, shouldValidate: true })
    } else {
      const newValue = [...new Set([...currentValue, ...weekdayDateStrings])]
      setValue(name, newValue, { shouldDirty: true, shouldValidate: true })
    }
  }

  const isWeekdayFullySelected = (weekdayIndex: number): boolean => {
    const currentValue = getCurrentValue()
    const weekdayDays = days
      .map(week => week[weekdayIndex])
      .filter(
        day => !day.isDisabled && !isDateDisabledDueToAfterHours(day.date)
      )
    return (
      weekdayDays.length > 0 &&
      weekdayDays.every(d => currentValue.includes(d.date.toJSON()))
    )
  }

  //#endregion

  return (
    <div className="container p-0 m-0">
      <div className="d-flex justify-content-between align-items-baseline mb-1">
        {selectedCount > 0 ? (
          <small className="text-muted">{selectedCount} dní vybráno</small>
        ) : (
          <span />
        )}
        {allowSpecialButtons && (
          <div className="d-inline-flex gap-3">
            <span
              className="smj-text-action text-muted"
              onClick={selectAll}
              title="Zvolit všechny dny"
            >
              Vybrat vše
            </span>
            <span
              className="smj-text-action text-muted"
              onClick={clearAll}
              title="Vypnout všechny dny"
            >
              Smazat vše
            </span>
          </div>
        )}
      </div>
      <div className="row gx-2 mt-1">
        {weekDays.map((day, wdIndex) => (
          <React.Fragment key={day}>
            <div className="col d-flex justify-content-center">
              {allowSpecialButtons && setValue ? (
                <span
                  className={`weekday-toggle ${
                    isWeekdayFullySelected(wdIndex)
                      ? 'weekday-toggle-active'
                      : ''
                  }`}
                  onClick={() => toggleWeekday(wdIndex)}
                  title={`Přepnout všechny ${day.toLowerCase()}`}
                >
                  {day}
                </span>
              ) : (
                day
              )}
            </div>
          </React.Fragment>
        ))}
      </div>
      {days.map(week => (
        <React.Fragment key={makeWeekKey(week)}>
          <div className="row gx-2">
            {week.map(day => (
              <React.Fragment key={day.date.toJSON()}>
                <div
                  className="col gy-2"
                  onClick={() => {
                    if (isDateDisabledDueToAfterHours(day.date)) {
                      setShowCallModal(true)
                    }
                  }}
                >
                  <input
                    type="checkbox"
                    className="btn-check"
                    id={`${name}-${day.date.toJSON()}`}
                    autoComplete="off"
                    {...register()}
                    value={day.date.toJSON()}
                    disabled={
                      day.isDisabled || isDateDisabledDueToAfterHours(day.date)
                    }
                  />
                  <label
                    className={`btn btn-day-select btn-light ${
                      day.isDisabled ? 'smj-action-hidden' : ''
                    } ${isToday(day.date) ? 'smj-day-today' : ''}`}
                    htmlFor={`${name}-${day.date.toJSON()}`}
                  >
                    {day.date.getDate()}
                  </label>
                </div>
              </React.Fragment>
            ))}
          </div>
        </React.Fragment>
      ))}
      {showCallModal && (
        <CallSMJTeamModal
          onClose={() => setShowCallModal(false)}
          additionalText={`Je po ${disableAfter}. hodině, zvolení časové dostupnosti je tudíž znepřístupněno.`}
        />
      )}
    </div>
  )
}
