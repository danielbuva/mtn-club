import { fetchPrimaryClubId } from '@/lib/clubs/queries'
import { createPublicClient } from '@/lib/supabase/public'

export async function getPrimaryClubId(): Promise<string | null> {
  const supabase = createPublicClient()
  return fetchPrimaryClubId(supabase)
}
