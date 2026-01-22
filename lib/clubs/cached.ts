import { createPublicClient } from '@/lib/supabase/public'
import { fetchPrimaryClubId } from '@/lib/clubs/queries'

export async function getPrimaryClubIdCached(): Promise<string | null> {
  'use cache'
  const supabase = createPublicClient()
  return fetchPrimaryClubId(supabase)
}
