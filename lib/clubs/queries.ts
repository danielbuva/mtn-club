import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'

export async function fetchPrimaryClubId(
  client: SupabaseClient<Database>,
): Promise<string | null> {
  const { data, error } = await client
    .from('clubs')
    .select('id')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (error) {
    throw error
  }

  return data?.id ?? null
}
