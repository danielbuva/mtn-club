import type { SupabaseClient } from '@supabase/supabase-js'
import { LEGACY_PLACEHOLDER_TRIP_IDS } from '@/lib/events/queries'
import type { Database } from '@/lib/supabase/types'

export function parseTripListParams(
  params: Record<string, string | string[] | undefined>,
) {
  const value = typeof params.page === 'string' ? Number(params.page) : 1
  return {
    view: params.view === 'past' ? 'past' : 'upcoming',
    page:
      Number.isSafeInteger(value) && value > 0 && value <= 100000 ? value : 1,
  }
}

export async function fetchTripListPage(
  client: SupabaseClient<Database>,
  view: string,
  page: number,
) {
  const pageSize = 24
  const offset = (page - 1) * pageSize
  const now = new Date().toISOString()
  const query = client
    .from('trips')
    .select('*')
    .not('id', 'in', `(${LEGACY_PLACEHOLDER_TRIP_IDS.join(',')})`)
    .in('lifecycle_status', ['published', 'canceled'])
    .order('starts_at', { ascending: view !== 'past' })
    .order('id', { ascending: view !== 'past' })
    .range(offset, offset + pageSize)
  const { data, error } = await (view === 'past'
    ? query.lt('starts_at', now)
    : query.gte('starts_at', now))
  if (error) throw error
  return {
    events: (data ?? []).slice(0, pageSize),
    hasMore: (data?.length ?? 0) > pageSize,
  }
}
