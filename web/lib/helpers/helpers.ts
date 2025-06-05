export const capitalizeFirstLetter = (text: string) => {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

export const formatDateLong = (date: Date, capitalize = true) => {
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    timeZone: 'Europe/Prague',
  }
  const formatted = new Intl.DateTimeFormat('cs-CZ', options).format(date)
  return capitalize ? capitalizeFirstLetter(formatted) : formatted
}

export const formatDateNumeric = (date: Date) => {
  const options: Intl.DateTimeFormatOptions = {
    month: 'numeric',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'Europe/Prague',
  }
  const formatted = new Intl.DateTimeFormat('cs-CZ', options).format(date)
  return formatted
}

export const formatDateShort = (date: Date) => {
  const options: Intl.DateTimeFormatOptions = {
    month: 'numeric',
    weekday: 'short',
    day: 'numeric',
    timeZone: 'Europe/Prague',
  }
  return new Intl.DateTimeFormat('cs-CZ', options).format(date)
}

export const getMonthName = (date: Date, capitalize = true) => {
  const options: Intl.DateTimeFormatOptions = {
    month: 'long',
    timeZone: 'Europe/Prague',
  }
  const formatted = new Intl.DateTimeFormat('cs-CZ', options).format(date)
  return capitalize ? capitalizeFirstLetter(formatted) : formatted
}

export const getWeekdayName = (date: Date, capitalize = true) => {
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    timeZone: 'Europe/Prague',
  }
  const formatted = new Intl.DateTimeFormat('cs-CZ', options).format(date)
  return capitalize ? capitalizeFirstLetter(formatted) : formatted
}

export const convertToISOFormat = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const isoFormat = `${year}/${month}/${day}`
  return isoFormat
}

export const getWeekdayNames = (capitalize = true) => {
  const weekdayNames: string[] = []

  for (let i = 0; i < 7; i++) {
    const date = new Date(2024, 0, 29) // Day starting with monday
    date.setDate(date.getDate() + i)
    const formatted = getWeekdayName(date, capitalize)
    weekdayNames.push(formatted)
  }

  return weekdayNames
}

export function datesBetween(start: Date, end: Date) {
  const dates = []
  for (
    let date = new Date(start);
    date <= end;
    date.setDate(date.getDate() + 1)
  ) {
    dates.push(new Date(date))
  }
  return dates
}

export function isBetweenDates(start: Date, end: Date, date: Date) {
  return date >= start && date <= end
}

export function filterUniqueById<T extends { id: string }>(elements: T[]): T[] {
  return Array.from(new Map(elements.map(item => [item.id, item])).values())
}

export function relativeTime(time: Date) {
  const TIME_PERIODS = [
    { amount: 60, name: 'seconds' },
    { amount: 60, name: 'minutes' },
    { amount: 24, name: 'hours' },
    { amount: 7, name: 'days' },
    { amount: 4.34524, name: 'weeks' },
    { amount: 12, name: 'months' },
    { amount: Number.POSITIVE_INFINITY, name: 'years' },
  ]

  const formatter = new Intl.RelativeTimeFormat('cs', { numeric: 'auto' })
  let duration = (time.getTime() - new Date().getTime()) / 1000

  for (const period of TIME_PERIODS) {
    if (Math.abs(duration) < period.amount) {
      return formatter.format(
        Math.round(duration),
        period.name as Intl.RelativeTimeFormatUnit
      )
    }
    duration /= period.amount
  }
}

export function datesAfterDate(dates: Date[], date: Date) {
  return dates.filter(d => d >= date)
}

/**
 * Picks only the specified keys from an object and returns a new object with only those keys and their values
 * @param obj Original object
 * @param keys Keys to pick from that object
 * @returns New object with only the specified keys and their values
 */
export function pick<
  T extends Record<string, unknown>,
  K extends string | number | symbol
>(obj: T, ...keys: K[]) {
  return Object.fromEntries(
    keys.map(key => [key, obj[key as unknown as keyof T]])
  ) as { [key in K]: key extends keyof T ? T[key] : undefined }
}

export function formatNumberAfterThreeDigits(value: string) {
  return value.replace(/(?=(\d{3})+(?!\d))/g, ' ');
}

export function formatPhoneNumber(value: string) {
  // Remove any existing spaces and non-numeric characters
  const phoneNumber = formatNumber(value)
  // Start with +
  const startsWithPlus = value.startsWith('+')
  // Limitation
  const maxDigits = startsWithPlus ? 12 : 9
  const limitedPhoneNumber = phoneNumber.slice(0, maxDigits)
  // Add spaces after every third digit
  const formattedPhoneNumber = limitedPhoneNumber.replace(
    /(\d{3})(?=\d)/g,
    '$1 '
  )
  return startsWithPlus
    ? `+${formattedPhoneNumber}`
    : formattedPhoneNumber || ''
}

// Replace redundant spaces by one space and trim spaces from front.
export function removeRedundantSpace(value: string) {
  return value.replace(/\s+/g, ' ').trimStart();
}

// Get rid of anything that isn't non negative number
export function formatNumber(value: string) {
  return value.replace(/\D/g, '');
}

export function removeAccent(str: string) {
  return str.normalize('NFD').replace(/\p{Diacritic}/gu, '');
}

export function normalizeString(str: string) {
  const withoutRedundantSpace = removeRedundantSpace(str)
  const withRemovedAccent = removeAccent(withoutRedundantSpace)
  const inLowerCase = withRemovedAccent.toLowerCase()
  return inLowerCase
}

export function validateTimeInput(str: string) {
  return /^([01][0-9]|2[0-3]):[0-5][0-9]$/.test(str);
}

export function getHourAndMinute(time: string) {
  return time.split(':').map(part => parseInt(part))
}

export function formateTime(time: string) {
  const [hours, minutes] = getHourAndMinute(time)

  const formattedHours = hours < 10 ? '0' + hours : hours.toString()
  const formattedMinutes = minutes < 10 ? '0' + minutes : minutes.toString()

  return `${formattedHours}:${formattedMinutes}`
}

export function compareDates(dateA: Date[], dateB: Date[]) {
  if (!dateA && !dateB) return 0
  if (!dateA) return 1
  if (!dateB) return -1

  const firstDateA = dateA[0]
  const firstDateB = dateB[0]

  if (!firstDateA && !firstDateB) return 0
  if (!firstDateA) return 1
  if (!firstDateB) return -1

  return firstDateA.getTime() - firstDateB.getTime()
}

export function compareTimes(timeA: string | null, timeB: string | null) {
  if (!timeA && !timeB) return 0
  if (!timeA) return 1
  if (!timeB) return -1
  return formateTime(timeA).localeCompare(formateTime(timeB))
}
