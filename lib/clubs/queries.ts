import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'

export async function fetchPrimaryClubId(
  _client: SupabaseClient<Database>,
): Promise<string | null> {
  return null
}
