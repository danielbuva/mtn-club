import type { SupabaseClient } from '@supabase/supabase-js'
import { addMonths } from 'date-fns'
import { cacheTag } from 'next/cache'
import { AUTH_CACHE_TAG } from '@/lib/auth/tags'
import { fetchTripsInRange } from '@/lib/events/queries'
import type { CalendarTrip } from '@/lib/events/types'
import { homeTripRowToCalendarTrip } from '@/lib/home/mappers'
import type { HomeTripRow } from '@/lib/home/types'
import { createPublicClient } from '@/lib/supabase/public'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/types'

export type HomeTripsOptions = {
  limit?: number
  monthsAhead?: number
}

type DateRange = {
  start: Date
  end: Date
}

async function fetchHomeTripsInRange(
  client: SupabaseClient<Database>,
  range: DateRange,
  limit: number,
): Promise<HomeTripRow[]> {
  const events = await fetchTripsInRange(client, range)
  return events.slice(0, limit)
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
