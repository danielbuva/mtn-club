import { endOfMonth, startOfMonth } from 'date-fns'
import { cacheTag } from 'next/cache'
import { AUTH_CACHE_TAG } from '@/lib/auth/tags'
import { createPublicClient } from '@/lib/supabase/public'
import { eventToCalendarTrip } from '@/lib/events/mappers'
import {
  fetchPastTripsInRangePublic,
  fetchPastTripsPublic,
  fetchTripTeasersInRangePublic,
} from '@/lib/events/queries'
import type { CalendarTrip, TripTeaserDay } from '@/lib/events/types'

export type HomeTripsArgs = {
  limit?: number
}

export async function getHomeTripsCached({ limit = 50 }: HomeTripsArgs): Promise<CalendarTrip[]> {
  'use cache'
  cacheTag(AUTH_CACHE_TAG)
  const supabase = createPublicClient()
  const events = await fetchPastTripsPublic(supabase, { limit })
  return events.map(eventToCalendarTrip)
}

export type CalendarDataArgs = {
  month: string
  clubId: string | null
}

export type CalendarCachedData = {
  pastTrips: CalendarTrip[]
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
  cacheTag(AUTH_CACHE_TAG)
  const supabase = createPublicClient()
  const monthDate = parseMonthString(month)
  const range = {
    start: startOfMonth(monthDate),
    end: endOfMonth(monthDate),
  }

  const pastTripsPromise = fetchPastTripsInRangePublic(supabase, range).then((events) =>
    events.map(eventToCalendarTrip)
  )

  const teasersPromise = clubId
    ? fetchTripTeasersInRangePublic(supabase, clubId, range)
    : Promise.resolve<TripTeaserDay[]>([])

  const [pastTrips, teasers] = await Promise.all([pastTripsPromise, teasersPromise])

  return { pastTrips, teasers }
}
