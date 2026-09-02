import type { SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'
import type {
  CalendarTrip,
  EventInsert,
  EventRow,
  TripTeaserDay,
} from '@/lib/events/types'
import type { Database } from '@/lib/supabase/types'

export type DateRange = {
  start: Date
  end: Date
}

export const LEGACY_PLACEHOLDER_TRIP_IDS = [
  'cdc9d374-b3ae-4487-87f2-5d5ecb8bab82',
  '568faa96-e369-4920-8f5f-decc22154f73',
  '97565328-10e5-478a-864b-5b3bd21c269a',
  'a0281b87-006f-4ad2-b46e-c3292848f316',
] as const

const legacyPlaceholderFilter = `(${LEGACY_PLACEHOLDER_TRIP_IDS.join(',')})`

const buildTripsRangeQuery = (
  client: SupabaseClient<Database>,
  range: DateRange,
) => {
  const startIso = range.start.toISOString()
  const endIso = range.end.toISOString()

  return client
    .from('trips')
    .select('*')
    .not('id', 'in', legacyPlaceholderFilter)
    .lte('starts_at', endIso)
    .or(`ends_at.is.null,ends_at.gte.${startIso}`)
    .order('starts_at', { ascending: true })
}

export async function fetchTripsInRange(
  client: SupabaseClient<Database>,
  range: DateRange,
): Promise<EventRow[]> {
  const { data, error } = await buildTripsRangeQuery(client, range)
  if (error) {
    console.error('TRIPS ERROR', error)
    throw error
  }
  return (data ?? []).filter(
    trip => !trip.schedule_key?.startsWith('fall-2026-weekly-'),
  )
}

export async function fetchPublicHostsByTrip(
  client: SupabaseClient<Database>,
  tripIds: string[],
): Promise<Map<string, CalendarTrip['hosts']>> {
  const hostsByTrip = new Map<string, CalendarTrip['hosts']>()
  if (tripIds.length === 0) return hostsByTrip

  const [
    { data: hosts, error: hostsError },
    { data: credits, error: creditsError },
  ] = await Promise.all([
    client.from('club_hosts').select('id, public_name, club_title'),
    client
      .from('trip_hosts')
      .select('trip_id, host_id, credited_title, sort_order')
      .in('trip_id', tripIds)
      .order('sort_order', { ascending: true }),
  ])

  if (hostsError || creditsError) {
    return hostsByTrip
  }

  const hostsById = new Map((hosts ?? []).map(host => [host.id, host]))
  for (const credit of credits ?? []) {
    const host = hostsById.get(credit.host_id)
    if (!host) continue
    const current = hostsByTrip.get(credit.trip_id) ?? []
    current.push({
      name: host.public_name,
      title: credit.credited_title || host.club_title,
    })
    hostsByTrip.set(credit.trip_id, current)
  }

  return hostsByTrip
}

export async function fetchPastTripsInRangePublic(
  client: SupabaseClient<Database>,
  range: DateRange,
): Promise<EventRow[]> {
  // Public client relies on RLS for past-only visibility; we only bound the date window.
  return fetchTripsInRange(client, range)
}

export async function fetchUpcomingTripsInRangeMember(
  client: SupabaseClient<Database>,
  range: DateRange,
): Promise<EventRow[]> {
  // Member access is enforced by RLS; we only bound the date window to "upcoming".
  const now = new Date()
  const effectiveStart = range.start > now ? range.start : now
  if (effectiveStart > range.end) {
    return []
  }

  return fetchTripsInRange(client, {
    start: effectiveStart,
    end: range.end,
  })
}

export async function fetchPastTripsPublic(
  client: SupabaseClient<Database>,
  options?: { limit?: number },
): Promise<EventRow[]> {
  const limit = options?.limit ?? 50
  const nowIso = new Date().toISOString()

  const { data, error } = await client
    .from('trips')
    .select('*')
    .not('id', 'in', legacyPlaceholderFilter)
    .lt('starts_at', nowIso)
    .order('starts_at', { ascending: false })
    .limit(limit)

  if (error) {
    throw error
  }

  return data ?? []
}

export type CreateEventPayload = EventInsert

export async function createEvent(
  client: SupabaseClient<Database>,
  payload: CreateEventPayload,
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
  _client: SupabaseClient<Database>,
  _clubId: string,
  _range: { start: Date; end: Date },
): Promise<TripTeaserDay[]> {
  const parsed = tripTeaserListSchema.safeParse([])
  if (!parsed.success) {
    throw new Error('Invalid trip teaser response')
  }
  return parsed.data
}
