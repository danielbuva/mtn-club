import 'server-only'
import type { User } from '@supabase/supabase-js'
import { authHref } from '@/lib/auth/return-to'
import type { createClient } from '@/lib/supabase/server'

type Db = Awaited<ReturnType<typeof createClient>>

/**
 * Accounts created on or after this moment must have a first and last name.
 * Older accounts keep working with whatever name they have.
 */
export const NAME_REQUIRED_SINCE = '2026-11-06T04:00:00Z'

export function nameRequiredFor(user: Pick<User, 'created_at'>) {
  return new Date(user.created_at).getTime() >= Date.parse(NAME_REQUIRED_SINCE)
}

export async function needsProfileName(db: Db, user: User) {
  if (!nameRequiredFor(user)) return false
  const { data, error } = await db
    .from('profiles')
    .select('first_name,last_name')
    .eq('user_id', user.id)
    .maybeSingle()
  // Never lock someone out because a read failed; the next sign-in asks again.
  if (error) return false
  return !data?.first_name?.trim() || !data?.last_name?.trim()
}

export function completeProfileHref(returnTo: string) {
  return authHref('/auth/complete-profile', returnTo)
}
