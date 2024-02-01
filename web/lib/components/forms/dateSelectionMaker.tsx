import { datesBetween, isBetweenDates } from 'lib/helpers/helpers'

export default function dateSelectionMaker(
  eventStartDate: string,
  eventEndDate: string
) {
  const start = new Date(eventStartDate)
  const end = new Date(eventEndDate)

  // Add placeholders to the first week to fill it to a full 7 days
  const firstWeekdayIndex = (start.getDay() + 6) % 7
  if (firstWeekdayIndex > 0) {
    // Doesn't start with monday
    start.setDate(start.getDate() - firstWeekdayIndex)
  }

  // Add placeholders to the last week to fill it to a full 7 days
  const lastWeekdayIndex = (end.getDay() + 6) % 7
  if (lastWeekdayIndex < 6) {
    // Doesn't end with sunday
    end.setDate(end.getDate() + 6 - lastWeekdayIndex)
  }

  const days = datesBetween(start, end)

  const evnetStart = new Date(eventStartDate)
  const eventEnd = new Date(eventEndDate)

  const splitIntoWeeks = (days: Date[]): DateBool[][] => {
    const weeks: DateBool[][] = []
    let currentWeek: DateBool[] = []

    days.forEach((day, index) => {
      const weekdayIndex = (day.getDay() + 6) % 7 // Convert weekdays as Mon = 0, ..., Sun = 6

      if (weekdayIndex === 0 && index !== 0) {
        weeks.push(currentWeek) // Start new week
        currentWeek = []
      }
      const isDisabled = !isBetweenDates(evnetStart, eventEnd, day)
      currentWeek.push({ date: day, isDisabled: isDisabled })
    })

    weeks.push(currentWeek) // Last week
    return weeks
  }

  return splitIntoWeeks(days)
}
