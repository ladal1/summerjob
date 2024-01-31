import { datesBetween } from 'lib/helpers/helpers'
// TODO: simplify
export default function dateSelectionMaker(
  eventStartDate: string,
  eventEndDate: string
) {
  const days = datesBetween(new Date(eventStartDate), new Date(eventEndDate))

  const firstDay = days[0]
  const lastDay = days[days.length - 1]

  const splitIntoWeeks = (days: Date[]): DateBool[][] => {
    const weeks: DateBool[][] = []
    let currentWeek: DateBool[] = []

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

  return splitIntoWeeks(days)
}
