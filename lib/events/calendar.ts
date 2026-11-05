import { endOfYear, startOfYear } from 'date-fns'
import { eventToCalendarTrip } from '@/lib/events/mappers'
import { fetchPublicHostsByTrip, fetchTripsInRange } from '@/lib/events/queries'
import type { CalendarTrip, TripTeaserDay } from '@/lib/events/types'
import { createPublicClient } from '@/lib/supabase/public'
import { createClient } from '@/lib/supabase/server'

export type ViewerKey = 'public' | 'member'

export type CalendarYearData = {
  year: number
  trips: CalendarTrip[]
  teasers: TripTeaserDay[]
}

type CalendarYearDataArgs = {
  year: number
  viewerKey: ViewerKey
}

export async function getCalendarYearData({
  year,
  viewerKey,
}: CalendarYearDataArgs): Promise<CalendarYearData> {
  const range = {
    start: startOfYear(new Date(year, 0, 1)),
    end: endOfYear(new Date(year, 0, 1)),
  }

  const supabase =
    viewerKey === 'member' ? await createClient() : createPublicClient()
  const events = await fetchTripsInRange(supabase, range)
  const hostsByTrip = await fetchPublicHostsByTrip(
    supabase,
    events.map(event => event.id),
  )

  return {
    year,
    trips: events.map(event => ({
      ...eventToCalendarTrip(event),
      hosts: hostsByTrip.get(event.id) ?? [],
    })),
    teasers: [],
  }
}
