import type { TripDetail } from './types'

const fallbackZone = 'America/Los_Angeles'

function parts(
  value: Date,
  timeZone: string,
  options: Intl.DateTimeFormatOptions,
) {
  return new Intl.DateTimeFormat('en-US', { timeZone, ...options }).format(
    value,
  )
}

/** "Fri, Nov 6 – Sun, Nov 8" or "Sat, Nov 22". */
export function tripDateLine(
  trip: Pick<TripDetail, 'startAt' | 'endAt' | 'timeZone'>,
) {
  const zone = trip.timeZone ?? fallbackZone
  const day = (value: Date) =>
    parts(value, zone, { weekday: 'short', month: 'short', day: 'numeric' })
  const key = (value: Date) => parts(value, zone, { dateStyle: 'short' })
  if (!trip.endAt || key(trip.startAt) === key(trip.endAt))
    return day(trip.startAt)
  return `${day(trip.startAt)} – ${day(trip.endAt)}`
}

/** "4:00 PM start · PST", "7:00 – 11:00 AM PST", or null for all-day trips. */
export function tripTimeLine(
  trip: Pick<TripDetail, 'startAt' | 'endAt' | 'timeZone' | 'isAllDay'>,
) {
  if (trip.isAllDay) return null
  const zone = trip.timeZone ?? fallbackZone
  const time = (value: Date) =>
    parts(value, zone, { hour: 'numeric', minute: '2-digit' })
  const abbr = parts(trip.startAt, zone, { timeZoneName: 'short' })
    .split(' ')
    .pop()
  const key = (value: Date) => parts(value, zone, { dateStyle: 'short' })
  if (trip.endAt && key(trip.startAt) === key(trip.endAt))
    return `${time(trip.startAt)} – ${time(trip.endAt)} ${abbr}`
  return `${time(trip.startAt)} start · ${abbr}`
}

/** "Thu, Nov 5, 11:59 PM PST" */
export function tripMoment(value: string, timeZone?: string) {
  return parts(new Date(value), timeZone ?? fallbackZone, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  })
}

export function signupLine(
  trip: Pick<
    TripDetail,
    | 'registrationOpensAt'
    | 'registrationClosesAt'
    | 'timeZone'
    | 'status'
    | 'registrationReadOnly'
  >,
  now = new Date(),
) {
  if (trip.status === 'cancelled') return null
  const opens = trip.registrationOpensAt
    ? new Date(trip.registrationOpensAt)
    : null
  if (opens && opens > now)
    return {
      label: 'Opens',
      value: tripMoment(trip.registrationOpensAt ?? '', trip.timeZone),
    }
  if (trip.registrationReadOnly || trip.status === 'closed')
    return { label: 'Closed', value: 'Signups are closed' }
  if (trip.registrationClosesAt)
    return {
      label: 'Closes',
      value: tripMoment(trip.registrationClosesAt, trip.timeZone),
    }
  return null
}

export function spotsLine(
  trip: Pick<TripDetail, 'capacity' | 'rsvpCount' | 'waitlistCount' | 'status'>,
) {
  const going = trip.rsvpCount ?? 0
  const head = `${going} going`
  if (!trip.capacity) return { head, detail: 'No group limit' }
  const left = Math.max(trip.capacity - going, 0)
  if (trip.waitlistCount)
    return {
      head: `${head} of ${trip.capacity}`,
      detail: `${trip.waitlistCount} on the waitlist`,
    }
  if (left === 0)
    return {
      head: `${head} of ${trip.capacity}`,
      detail: trip.status === 'waitlist' ? 'Full · waitlist open' : 'Full',
    }
  return {
    head: `${head} of ${trip.capacity}`,
    detail: `${left} ${left === 1 ? 'spot' : 'spots'} left`,
  }
}

const fmtMiles = (miles: number) =>
  `${miles.toFixed(miles % 1 === 0 ? 0 : 1)} mi`

export function tripStatsLine(trip: TripDetail) {
  const stats: string[] = []
  if (trip.climbStyle) stats.push(trip.climbStyle)
  if (trip.gradeMin && trip.gradeMax)
    stats.push(`${trip.gradeMin}–${trip.gradeMax}`)
  if (typeof trip.distanceMi === 'number') stats.push(fmtMiles(trip.distanceMi))
  if (typeof trip.elevationFt === 'number')
    stats.push(`${trip.elevationFt.toLocaleString('en-US')} ft gain`)
  if (typeof trip.nights === 'number')
    stats.push(`${trip.nights} night${trip.nights === 1 ? '' : 's'}`)
  if (trip.campStyle) stats.push(trip.campStyle)
  return stats.length ? stats.join(' · ') : null
}
