import type { CalendarTrip } from '@/lib/events/types'

const tripScheduleIdentity = (trip: CalendarTrip) =>
  `${trip.dateStart}:${trip.title.trim().toLowerCase()}`

export function getSingleTripForDay(
  dayKey: string,
  trips: CalendarTrip[],
): CalendarTrip | null {
  const uniqueTrips = Array.from(
    new Map(trips.map(trip => [tripScheduleIdentity(trip), trip])).values(),
  )
  const tripsStartingToday = uniqueTrips.filter(
    trip => trip.dateStart === dayKey,
  )

  if (tripsStartingToday.length === 1) {
    return tripsStartingToday[0]
  }

  return uniqueTrips.length === 1 ? uniqueTrips[0] : null
}
