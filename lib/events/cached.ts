import { endOfMonth, startOfMonth } from 'date-fns'
import { createPublicClient } from '@/lib/supabase/public'
import { eventToCalendarTrip } from '@/lib/events/mappers'
import { fetchEventsInRange, fetchPastTrips, fetchTripTeasersInRange } from '@/lib/events/queries'
import type { CalendarTrip, TripTeaserDay } from '@/lib/events/types'

export type HomeTripsArgs = {
  limit?: number
}

export async function getHomeTripsCached({ limit = 50 }: HomeTripsArgs): Promise<CalendarTrip[]> {
  'use cache'
  const supabase = createPublicClient()
  const events = await fetchPastTrips(supabase, { limit })
  return events.map(eventToCalendarTrip)
}

export type CalendarDataArgs = {
  month: string
  clubId: string | null
}

export type CalendarCachedData = {
  trips: CalendarTrip[]
  teasers: TripTeaserDay[]
}

const parseMonthString = (month: string): Date => {
  const [yearValue, monthValue] = month.split('-')
  const year = Number(yearValue)
  const monthIndex = Number(monthValue) - 1
  if (!Number.isFinite(year) || !Number.isFinite(monthIndex)) {
    return new Date()
  }

  return new Date(year, monthIndex, 1)
}

export async function getCalendarTripsCached({ month, clubId }: CalendarDataArgs): Promise<CalendarCachedData> {
  'use cache'
  const supabase = createPublicClient()
  const monthDate = parseMonthString(month)
  const range = {
    start: startOfMonth(monthDate),
    end: endOfMonth(monthDate),
  }

  const tripsPromise = fetchEventsInRange(supabase, range).then((events) =>
    events.map(eventToCalendarTrip)
  )

  const teasersPromise = clubId
    ? fetchTripTeasersInRange(supabase, clubId, range)
    : Promise.resolve<TripTeaserDay[]>([])

  const [trips, teasers] = await Promise.all([tripsPromise, teasersPromise])

  return { trips, teasers }
}
