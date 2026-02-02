import { connection } from 'next/server'
import { fetchPrimaryClubId } from '@/lib/clubs/queries'
import { createClient } from '@/lib/supabase/server'

export async function getPrimaryClubId(): Promise<string | null> {
  connection()
  const supabase = await createClient()

  try {
    return await fetchPrimaryClubId(supabase)
  } catch {
    return null
  }
}
