import { createPublicClient } from '@/lib/supabase/public'
import { fetchPrimaryClubId } from '@/lib/clubs/queries'

export async function getPrimaryClubId(): Promise<string | null> {
  const supabase = createPublicClient()
  return fetchPrimaryClubId(supabase)
}
