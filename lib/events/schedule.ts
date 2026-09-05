import type { CalendarTrip } from './types'

const identity = (trip: CalendarTrip) =>
  trip.scheduleKey ?? `${trip.dateStart}:${trip.title.toLowerCase()}`

export function mergeScheduleTrips(
  publishedTrips: CalendarTrip[],
  databaseTrips: CalendarTrip[],
): CalendarTrip[] {
  const byIdentity = new Map(publishedTrips.map(trip => [identity(trip), trip]))
  for (const trip of databaseTrips) byIdentity.set(identity(trip), trip)
  return [...byIdentity.values()]
    .filter(trip => trip.lifecycleStatus !== 'archived')
    .sort((left, right) => left.dateStart.localeCompare(right.dateStart))
}
