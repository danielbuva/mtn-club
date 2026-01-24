import { z } from 'zod'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'
import type { EventInsert, EventRow, TripTeaserDay } from '@/lib/events/types'

export type DateRange = {
  start: Date
  end: Date
}

const buildTripsRangeQuery = (
  client: SupabaseClient<Database>,
  range: DateRange
) => {
  const startIso = range.start.toISOString()
  const endIso = range.end.toISOString()

  return client
    .from('trips')
    .select('*')
    .lte('start_at', endIso)
    .or(`end_at.is.null,end_at.gte.${startIso}`)
    .order('start_at', { ascending: true })
}

export async function fetchTripsInRange(
  client: SupabaseClient<Database>,
  range: DateRange
): Promise<EventRow[]> {
  const { data, error } = await buildTripsRangeQuery(client, range)

  if (error) {
    console.error('TRIPS ERROR', error)
    throw error
  }

  return data ?? []
}

export async function fetchPastTripsInRangePublic(
  client: SupabaseClient<Database>,
  range: DateRange
): Promise<EventRow[]> {
  // Public client relies on RLS for past-only visibility; we only bound the date window.
  const { data, error } = await buildTripsRangeQuery(client, range)

  if (error) {
    console.error('TRIPS ERROR', error)
    throw error
  }

  return data ?? []
}

export async function fetchUpcomingTripsInRangeMember(
  client: SupabaseClient<Database>,
  range: DateRange
): Promise<EventRow[]> {
  // Member access is enforced by RLS; we only bound the date window to "upcoming".
  const now = new Date()
  const effectiveStart = range.start > now ? range.start : now
  if (effectiveStart > range.end) {
    return []
  }

  const { data, error } = await buildTripsRangeQuery(client, {
    start: effectiveStart,
    end: range.end,
  })

  if (error) {
    console.error('TRIPS ERROR', error)
    throw error
  }

  return data ?? []
}

export async function fetchPastTripsPublic(
  client: SupabaseClient<Database>,
  options?: { limit?: number }
): Promise<EventRow[]> {
  const limit = options?.limit ?? 50
  const nowIso = new Date().toISOString()

  const { data, error } = await client
    .from('trips')
    .select('*')
    .lt('start_at', nowIso)
    .order('start_at', { ascending: false })
    .limit(limit)

  if (error) {
    throw error
  }

  return data ?? []
}

export type CreateEventPayload = EventInsert & {
  activity_types?: string[]
}

export async function createEvent(
  client: SupabaseClient<Database>,
  payload: CreateEventPayload
): Promise<EventRow> {
  const { data, error } = await client
    .from('trips')
    .insert(payload)
    .select('*')
    .single()

  if (error) {
    throw error
  }

  return data
}

const tripTeaserDaySchema = z.object({
  day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  event_count: z.coerce.number().int().nonnegative(),
  official_count: z.coerce.number().int().nonnegative(),
})

const tripTeaserListSchema = z.array(tripTeaserDaySchema)

export async function fetchTripTeasersInRangePublic(
  client: SupabaseClient<Database>,
  clubId: string,
  range: { start: Date; end: Date }
): Promise<TripTeaserDay[]> {
  const { data, error } = await client.rpc('get_trip_teasers_in_range', {
    _club_id: clubId,
    _start: range.start.toISOString(),
    _end: range.end.toISOString(),
  })
  if (error) {
    throw error
  }

  const parsed = tripTeaserListSchema.safeParse(data ?? [])
  if (!parsed.success) {
    throw new Error('Invalid trip teaser response')
  }

  return parsed.data
}
