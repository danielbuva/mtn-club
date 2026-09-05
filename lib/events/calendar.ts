import { endOfYear, startOfYear } from 'date-fns'
import { getFall2026Calendar } from '@/lib/events/fall-2026'
import { eventToCalendarTrip } from '@/lib/events/mappers'
import { fetchPublicHostsByTrip, fetchTripsInRange } from '@/lib/events/queries'
import { mergeScheduleTrips } from '@/lib/events/schedule'
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

  try {
    const supabase =
      viewerKey === 'member' ? await createClient() : createPublicClient()
    const events = await fetchTripsInRange(supabase, range, true)
    const hostsByTrip = await fetchPublicHostsByTrip(
      supabase,
      events.map(event => event.id),
    )
    const databaseTrips = events.map(event => ({
      ...eventToCalendarTrip(event),
      hosts: hostsByTrip.get(event.id) ?? [],
    }))

    return {
      year,
      trips: mergePublishedSchedule(year, databaseTrips),
      teasers: [],
    }
  } catch (error) {
    console.error(
      'Calendar database unavailable; using published schedule.',
      error,
    )
    return {
      year,
      trips: mergePublishedSchedule(year, []),
      teasers: [] as TripTeaserDay[],
    }
  }
}

function mergePublishedSchedule(
  year: number,
  databaseTrips: CalendarTrip[],
): CalendarTrip[] {
  return mergeScheduleTrips(
    year === 2026 ? getFall2026Calendar() : [],
    databaseTrips,
  )
}
