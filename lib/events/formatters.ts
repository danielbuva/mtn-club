export const CLUB_TIME_ZONE = 'America/Los_Angeles'

export function formatDateRange(start: string, end?: string | null): string {
  const startDate = parseCalendarDate(start)
  const endDate = end ? parseCalendarDate(end) : startDate

  const sameDay =
    startDate.getFullYear() === endDate.getFullYear() &&
    startDate.getMonth() === endDate.getMonth() &&
    startDate.getDate() === endDate.getDate()

  if (sameDay) {
    return startDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return `${startDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })} - ${endDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })}`
}

export function parseCalendarDate(value: string): Date {
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (dateOnly) {
    return new Date(
      Number(dateOnly[1]),
      Number(dateOnly[2]) - 1,
      Number(dateOnly[3]),
    )
  }
  return new Date(value)
}

export function formatDateOnly(value: Date, timeZone?: string): string {
  if (timeZone) {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(value)
    const year = parts.find(part => part.type === 'year')?.value
    const month = parts.find(part => part.type === 'month')?.value
    const day = parts.find(part => part.type === 'day')?.value

    if (!year || !month || !day) {
      throw new Error('Unable to format calendar date in its event time zone.')
    }

    return `${year}-${month}-${day}`
  }

  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function getClubCalendarDate(value = new Date()): Date {
  return parseCalendarDate(formatDateOnly(value, CLUB_TIME_ZONE))
}

export function formatTime(
  value: string | null | undefined,
  timeZone?: string,
): string {
  if (!value) return 'TBD'
  const date = new Date(value)
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone,
  })
}

export function formatTimeRange(
  start: string,
  end: string,
  timeZone?: string,
): string {
  return `${formatTime(start, timeZone)}–${formatTime(end, timeZone)}`
}

export function getSeasonTag(
  value: Date,
): 'spring' | 'summer' | 'fall' | 'winter' {
  const month = value.getMonth() + 1
  if (month >= 3 && month <= 5) return 'spring'
  if (month >= 6 && month <= 8) return 'summer'
  if (month >= 9 && month <= 11) return 'fall'
  return 'winter'
}
