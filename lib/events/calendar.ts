import { endOfYear, startOfYear } from 'date-fns'
import { getFall2026Calendar } from '@/lib/events/fall-2026'
import { eventToCalendarTrip } from '@/lib/events/mappers'
import {
  fetchPastTripsInRangePublic,
  fetchPublicHostsByTrip,
  fetchTripsInRange,
} from '@/lib/events/queries'
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
    const events =
      viewerKey === 'member'
        ? await fetchTripsInRange(supabase, range)
        : await fetchPastTripsInRangePublic(supabase, range)
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

const scheduleIdentity = (trip: CalendarTrip) =>
  `${trip.dateStart}:${trip.title.toLowerCase()}`

function mergePublishedSchedule(
  year: number,
  databaseTrips: CalendarTrip[],
): CalendarTrip[] {
  const publishedTrips = year === 2026 ? getFall2026Calendar() : []
  const byIdentity = new Map(
    publishedTrips.map(trip => [scheduleIdentity(trip), trip]),
  )

  for (const trip of databaseTrips) {
    byIdentity.set(scheduleIdentity(trip), trip)
  }

  return [...byIdentity.values()].sort((left, right) =>
    left.dateStart.localeCompare(right.dateStart),
  )
}
