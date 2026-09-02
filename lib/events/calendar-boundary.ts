export const CALENDAR_MIN_YEAR = 2026
export const CALENDAR_MIN_MONTH_INDEX = 8
export const CALENDAR_MAX_YEAR = 2100

const getMinimumCalendarDate = () =>
  new Date(CALENDAR_MIN_YEAR, CALENDAR_MIN_MONTH_INDEX, 1)

export function clampCalendarMonthDate(date: Date): Date {
  const monthDate = new Date(date.getFullYear(), date.getMonth(), 1)
  const minimum = getMinimumCalendarDate()
  const maximum = new Date(CALENDAR_MAX_YEAR, 11, 1)

  if (monthDate < minimum) return minimum
  if (monthDate > maximum) return maximum
  return monthDate
}

export function clampCalendarDate(date: Date): Date {
  const boundedMonth = clampCalendarMonthDate(date)
  if (
    boundedMonth.getFullYear() === date.getFullYear() &&
    boundedMonth.getMonth() === date.getMonth()
  ) {
    return date
  }
  return boundedMonth
}

export function isCalendarTripSupported(dateEnd: Date): boolean {
  return dateEnd >= getMinimumCalendarDate()
}
