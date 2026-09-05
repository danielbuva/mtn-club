import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'

/** Snapshot the server-owned host title when assigning public trip credits. */
export async function buildHostAssignments(
  supabase: SupabaseClient<Database>,
  tripId: string,
  hostIds: string[],
): Promise<Database['public']['Tables']['trip_hosts']['Insert'][]> {
  if (!hostIds.length) return []
  const { data, error } = await supabase
    .from('club_hosts')
    .select('id, club_title')
    .in('id', hostIds)
  if (error) throw error
  return [...new Set(hostIds)].map((hostId, index) => {
    const host = data?.find(row => row.id === hostId)
    if (
      !host ||
      typeof host.club_title !== 'string' ||
      !host.club_title.trim()
    ) {
      throw new Error(
        'A selected host is no longer available. Choose hosts again.',
      )
    }
    return {
      trip_id: tripId,
      host_id: hostId,
      credited_title: host.club_title,
      sort_order: index,
    }
  })
}
