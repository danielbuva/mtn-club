import { addDays, format } from 'date-fns'
import { formatDateOnly, parseCalendarDate } from '@/lib/events/formatters'
import type { CalendarTrip, TripTeaserDay } from '@/lib/events/types'

export {
  CALENDAR_MAX_YEAR,
  CALENDAR_MIN_MONTH_INDEX,
  CALENDAR_MIN_YEAR,
  clampCalendarDate,
  clampCalendarMonthDate,
  isCalendarTripSupported,
} from '@/lib/events/calendar-boundary'

export type ViewMode = 'calendar' | 'list'
export type SemesterKey = 'spring' | 'summer' | 'fall' | 'winter' | 'all'

export const SEMESTER_OPTIONS: { value: SemesterKey; label: string }[] = [
  { value: 'all', label: 'All year' },
  { value: 'spring', label: 'Spring' },
  { value: 'summer', label: 'Summer' },
  { value: 'fall', label: 'Fall' },
  { value: 'winter', label: 'Winter' },
]

const monthPattern = /^(\d{4})-(\d{2})$/

export function parseMonthParam(value?: string | null): Date | null {
  if (!value) return null
  const match = monthPattern.exec(value)
  if (!match) return null
  const year = Number(match[1])
  const monthIndex = Number(match[2]) - 1
  if (!Number.isFinite(year) || monthIndex < 0 || monthIndex > 11) {
    return null
  }
  return new Date(year, monthIndex, 1)
}

export function formatMonthParam(value: Date): string {
  return format(value, 'yyyy-MM')
}

export function groupTripsByDay(
  trips: CalendarTrip[],
): Map<string, CalendarTrip[]> {
  const map = new Map<string, CalendarTrip[]>()

  for (const trip of trips) {
    const start = parseCalendarDate(trip.dateStart)
    const end = parseCalendarDate(trip.dateEnd)
    let cursor = new Date(start)

    while (cursor <= end) {
      const key = formatDateOnly(cursor)
      const existing = map.get(key)
      if (existing) {
        existing.push(trip)
      } else {
        map.set(key, [trip])
      }
      cursor = addDays(cursor, 1)
    }
  }

  return map
}

export function buildTeaserMap(
  teasers: TripTeaserDay[],
): Map<string, TripTeaserDay> {
  const map = new Map<string, TripTeaserDay>()
  for (const teaser of teasers) {
    map.set(teaser.day, teaser)
  }
  return map
}

export function setQueryParams(params: Record<string, string | undefined>) {
  if (typeof window === 'undefined') return
  const url = new URL(window.location.href)
  Object.entries(params).forEach(([key, value]) => {
    if (!value) {
      url.searchParams.delete(key)
    } else {
      url.searchParams.set(key, value)
    }
  })
  window.history.replaceState(null, '', url.toString())
}

export function getSemesterRange(
  year: number,
  semester: SemesterKey,
): { start: Date; end: Date } | null {
  switch (semester) {
    case 'spring':
      return { start: new Date(year, 0, 1), end: new Date(year, 4, 31) }
    case 'summer':
      return { start: new Date(year, 5, 1), end: new Date(year, 7, 31) }
    case 'fall':
      return { start: new Date(year, 8, 1), end: new Date(year, 10, 30) }
    case 'winter':
      return { start: new Date(year, 11, 1), end: new Date(year, 11, 31) }
    default:
      return null
  }
}

export function isDateInRange(
  date: Date,
  range: { start: Date; end: Date },
): boolean {
  return date >= range.start && date <= range.end
}

export function isTripInRange(
  trip: CalendarTrip,
  range: { start: Date; end: Date },
): boolean {
  const start = parseCalendarDate(trip.dateStart)
  const end = parseCalendarDate(trip.dateEnd)
  return start <= range.end && end >= range.start
}
