import { cacheTag } from 'next/cache'
import { AUTH_CACHE_TAG } from '@/lib/auth/tags'
import { fetchPrimaryClubId } from '@/lib/clubs/queries'
import { createPublicClient } from '@/lib/supabase/public'

export async function getPrimaryClubIdCached(): Promise<string | null> {
  'use cache'
  cacheTag(AUTH_CACHE_TAG)
  const supabase = createPublicClient()
  return fetchPrimaryClubId(supabase)
}
