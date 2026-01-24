import { endOfYear, startOfYear } from 'date-fns'
import { createClient } from '@/lib/supabase/server'
import { createPublicClient } from '@/lib/supabase/public'
import { eventToCalendarTrip } from '@/lib/events/mappers'
import { fetchPastTripsInRangePublic, fetchTripTeasersInRangePublic, fetchTripsInRange } from '@/lib/events/queries'
import type { CalendarTrip, TripTeaserDay } from '@/lib/events/types'

export type ViewerKey = 'public' | 'member'

export type CalendarYearData = {
  year: number
  trips: CalendarTrip[]
  teasers: TripTeaserDay[]
}

type CalendarYearDataArgs = {
  year: number
  clubId: string | null
  viewerKey: ViewerKey
}

export async function getCalendarYearData({
  year,
  clubId,
  viewerKey,
}: CalendarYearDataArgs): Promise<CalendarYearData> {
  const range = {
    start: startOfYear(new Date(year, 0, 1)),
    end: endOfYear(new Date(year, 0, 1)),
  }

  if (viewerKey === 'member') {
    const supabase = await createClient()
    const events = await fetchTripsInRange(supabase, range)
    return {
      year,
      trips: events.map(eventToCalendarTrip),
      teasers: [],
    }
  }

  const supabase = createPublicClient()
  const events = await fetchPastTripsInRangePublic(supabase, range)
  const teasers = clubId
    ? await fetchTripTeasersInRangePublic(supabase, clubId, range)
    : ([] as TripTeaserDay[])

  return {
    year,
    trips: events.map(eventToCalendarTrip),
    teasers,
  }
}
