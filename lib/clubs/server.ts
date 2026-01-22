import { createClient } from '@/lib/supabase/server'
import { fetchPrimaryClubId } from '@/lib/clubs/queries'
import { connection } from 'next/server'

export async function getPrimaryClubId(): Promise<string | null> {
  connection()
  const supabase = await createClient()

  try {
    return await fetchPrimaryClubId(supabase)
  } catch {
    return null
  }
}
