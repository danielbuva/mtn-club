import { addMonths } from 'date-fns'
import { cacheTag } from 'next/cache'
import { AUTH_CACHE_TAG } from '@/lib/auth/tags'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'
import { createClient } from '@/lib/supabase/server'
import { createPublicClient } from '@/lib/supabase/public'
import { homeTripRowToCalendarTrip } from '@/lib/home/mappers'
import type { CalendarTrip } from '@/lib/events/types'
import type { HomeTripRow } from '@/lib/home/types'

export type HomeTripsOptions = {
  limit?: number
  monthsAhead?: number
}

type DateRange = {
  start: Date
  end: Date
}

const HOME_TRIP_FIELDS =
  'id,title,start_at,end_at,activity_types,difficulty,primary_location_name,primary_location_lat,primary_location_lng,lat,lon,visibility,short_summary,description,meetup_time,meeting_location_name,is_official'

const buildHomeTripsRangeQuery = (
  client: SupabaseClient<Database>,
  range: DateRange,
  limit: number
) => {
  const startIso = range.start.toISOString()
  const endIso = range.end.toISOString()

  return client
    .from('trips')
    .select(HOME_TRIP_FIELDS)
    .lte('start_at', endIso)
    .or(`end_at.is.null,end_at.gte.${startIso}`)
    .order('start_at', { ascending: true })
    .limit(limit)
}

async function fetchHomeTripsInRange(
  client: SupabaseClient<Database>,
  range: DateRange,
  limit: number
): Promise<HomeTripRow[]> {
  const { data, error } = await buildHomeTripsRangeQuery(client, range, limit)
  if (error) {
    console.error('HOME TRIPS ERROR', error)
    throw error
  }

  return (data ?? []) as HomeTripRow[]
}

const resolveHomeRange = (monthsAhead: number): DateRange => {
  const now = new Date()
  return {
    start: now,
    end: addMonths(now, monthsAhead),
  }
}

export async function getHomeTripsPublicCached({
  limit = 200,
  monthsAhead = 6,
}: HomeTripsOptions): Promise<CalendarTrip[]> {
  'use cache'
  cacheTag(AUTH_CACHE_TAG)
  const supabase = createPublicClient()
  const range = resolveHomeRange(monthsAhead)
  const events = await fetchHomeTripsInRange(supabase, range, limit)
  return events.map(homeTripRowToCalendarTrip)
}

export async function getHomeTripsForMember({
  limit = 200,
  monthsAhead = 6,
}: HomeTripsOptions): Promise<CalendarTrip[]> {
  const supabase = await createClient()
  const range = resolveHomeRange(monthsAhead)
  const events = await fetchHomeTripsInRange(supabase, range, limit)
  return events.map(homeTripRowToCalendarTrip)
}
