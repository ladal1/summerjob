import { getMonthName, getWeekdayNames } from 'lib/helpers/helpers'
import React from 'react'
import { UseFormRegisterReturn } from 'react-hook-form'

interface DateSelectionProps {
  name: string
  days: Date[]
  register: () => UseFormRegisterReturn
}

export default function DateSelection({
  name,
  days,
  register,
}: DateSelectionProps) {
  const firstDay = days[0]
  const lastDay = days[days.length - 1]

  const labelMonth =
    firstDay.getMonth() == lastDay.getMonth()
      ? getMonthName(firstDay)
      : getMonthName(firstDay) + ' / ' + getMonthName(lastDay)
  const labelYear =
    firstDay.getFullYear() == lastDay.getFullYear()
      ? firstDay.getFullYear()
      : firstDay.getFullYear() + ' / ' + lastDay.getFullYear()
  const labelSecondary = labelMonth + ' ' + labelYear

  const weekDays = getWeekdayNames()

  type MyDate = {
    date: Date
    isDisabled: boolean
  }

  const splitIntoWeeks = (days: Date[]): MyDate[][] => {
    const weeks: MyDate[][] = []
    let currentWeek: MyDate[] = []

    const addPlaceholders = (start: Date, end: Date) => {
      for (
        let date = new Date(start);
        date <= end;
        date.setDate(date.getDate() + 1)
      ) {
        currentWeek.push({ date: new Date(date), isDisabled: true })
      }
    }

    // Add placeholders to the first week to fill it to a full 7 days
    const firstWeekdayIndex = (firstDay.getDay() + 6) % 7
    if (firstWeekdayIndex > 0) {
      // Doesn't start with monday
      const placeholdersCount = firstWeekdayIndex
      const start = new Date(firstDay)
      start.setDate(firstDay.getDate() - placeholdersCount)
      const end = new Date(firstDay)
      end.setDate(firstDay.getDate() - 1)
      addPlaceholders(start, end)
    }

    days.forEach((day, index) => {
      const weekdayIndex = (day.getDay() + 6) % 7 // Convert weekdays as Mon = 0, ..., Sun = 6

      if (weekdayIndex === 0 && index !== 0) {
        weeks.push(currentWeek) // Start new week
        currentWeek = []
      }
      currentWeek.push({ date: day, isDisabled: false })
    })

    // Add placeholders to the last week to fill it to a full 7 days
    const lastWeekdayIndex = (lastDay.getDay() + 6) % 7
    if (lastWeekdayIndex < 6) {
      // Doesn't end with sunday
      const placeholdersCount = 6 - lastWeekdayIndex
      const start = new Date(lastDay)
      start.setDate(lastDay.getDate() + 1)
      const end = new Date(lastDay)
      end.setDate(lastDay.getDate() + placeholdersCount)
      addPlaceholders(start, end)
    }

    weeks.push(currentWeek) // Last week
    return weeks
  }

  const daysFill: MyDate[][] = splitIntoWeeks(days)

  const makeWeekKey = (week: MyDate[]): string => {
    const start = week[0].date
    const end = week[week.length - 1].date
    return start.toJSON() + '-' + end.toJSON()
  }

  return (
    <div className="container p-0 m-0">
      <label className="form-label fw-normal fs-5">{labelSecondary}</label>
      <div className="row gx-2">
        {weekDays.map(day => (
          <React.Fragment key={day}>
            <div className="col">{day}</div>
          </React.Fragment>
        ))}
      </div>
      {daysFill.map(week => (
        <React.Fragment key={makeWeekKey(week)}>
          <div className="row gx-2">
            {week.map(day => (
              <React.Fragment key={day.date.toJSON()}>
                <div className="col gy-2">
                  <input
                    type="checkbox"
                    className="btn-check"
                    id={`${name}-${day.date.toJSON()}`}
                    autoComplete="off"
                    {...register()}
                    value={day.date.toJSON()}
                    disabled={day.isDisabled}
                  />
                  <label
                    className={`btn btn-day-select ${
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
    </div>
  )
}
