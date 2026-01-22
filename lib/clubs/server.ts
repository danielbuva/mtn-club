import { unstable_noStore } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { fetchPrimaryClubId } from '@/lib/clubs/queries'

export async function getPrimaryClubId(): Promise<string | null> {
  unstable_noStore()
  const supabase = await createClient()

  try {
    return await fetchPrimaryClubId(supabase)
  } catch {
    return null
  }
}
