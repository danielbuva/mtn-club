import type { CalendarTrip } from '@/lib/events/types'

export function mergeCalendarTrips(
  tripGroups: readonly (readonly CalendarTrip[])[],
): CalendarTrip[] {
  const tripsById = new Map<string, CalendarTrip>()

  for (const trips of tripGroups) {
    for (const trip of trips) {
      // Overlapping year queries can return the same trip. Keep its first copy.
      if (!tripsById.has(trip.id)) {
        tripsById.set(trip.id, trip)
      }
    }
  }

  return Array.from(tripsById.values())
}
