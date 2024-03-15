import { DateBool } from 'lib/data/dateSelectionType'
import { getMonthName, getWeekdayNames } from 'lib/helpers/helpers'
import React, { useEffect, useState } from 'react'
import { UseFormRegisterReturn } from 'react-hook-form'
import CallSMJTeamModal from '../modal/CallSMJTeamModal'

interface DateSelectionProps {
  name: string
  days: DateBool[][]
  disableAfter?: number
  register: () => UseFormRegisterReturn
}

export default function DateSelection({
  name,
  days,
  disableAfter = undefined,
  register,
}: DateSelectionProps) {
  const firstDay = days[0][0].date
  const lastDay = days[days.length - 1][days[0].length - 1].date

  const labelMonth =
    firstDay.getMonth() == lastDay.getMonth()
      ? getMonthName(firstDay)
      : getMonthName(firstDay) + ' / ' + getMonthName(lastDay)
  const labelYear =
    firstDay.getFullYear() == lastDay.getFullYear()
      ? firstDay.getFullYear()
      : firstDay.getFullYear() + ' / ' + lastDay.getFullYear()
  const label = labelMonth + ' ' + labelYear

  const weekDays = getWeekdayNames()

  const makeWeekKey = (week: DateBool[]): string => {
    const start = week[0].date
    const end = week[week.length - 1].date
    return start.toJSON() + '-' + end.toJSON()
  }

  //#region Disable date button

  const [currentDate] = useState<Date>(() => new Date())
  const [tomorrowDate] = useState<Date>(() => {
    const tomorrow = new Date(currentDate.getTime())
    tomorrow.setDate(currentDate.getDate() + 1)
    return tomorrow
  })

  const isAfterHoursCalc = () => {
    if (!disableAfter) return false
    const currentHour = currentDate.getHours()
    return currentHour >= disableAfter
  }

  const [isAfterHours, setIsAfterHours] = useState<boolean>(isAfterHoursCalc())

  useEffect(() => {
    setIsAfterHours(isAfterHoursCalc())
  }, [disableAfter])

  const isDateRightAfterNow = (date: Date): boolean => {
    return date.getDate() === tomorrowDate.getDate()
  }

  const isDateDisabledDueToAfterHours = (date: Date) => {
    return isAfterHours && isDateRightAfterNow(date)
  }

  const [showCallModal, setShowCallModal] = useState(false)

  //#endregion

  return (
    <div className="container p-0 m-0">
      <label className="form-label fw-normal fs-5">{label}</label>
      <div className="row gx-2">
        {weekDays.map(day => (
          <React.Fragment key={day}>
            <div className="col d-flex justify-content-center">{day}</div>
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
                    }`}
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
