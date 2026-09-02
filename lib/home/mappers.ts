import { eventToCalendarTrip } from '@/lib/events/mappers'
import type { CalendarTrip } from '@/lib/events/types'
import type { HomeTripRow } from '@/lib/home/types'

export function homeTripRowToCalendarTrip(event: HomeTripRow): CalendarTrip {
  return eventToCalendarTrip(event)
}
