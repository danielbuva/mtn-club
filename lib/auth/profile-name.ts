import 'server-only'
import type { User } from '@supabase/supabase-js'
import { hasFullName, nameRequiredFor } from '@/lib/auth/name-policy'
import { authHref } from '@/lib/auth/return-to'
import type { createClient } from '@/lib/supabase/server'

type Db = Awaited<ReturnType<typeof createClient>>

export { NAME_REQUIRED_SINCE, nameRequiredFor } from '@/lib/auth/name-policy'

export async function needsProfileName(db: Db, user: User) {
  if (!nameRequiredFor(user)) return false
  const { data, error } = await db
    .from('profiles')
    .select('first_name,last_name')
    .eq('user_id', user.id)
    .maybeSingle()
  // Never lock someone out because a read failed; the next sign-in asks again.
  if (error) return false
  return !hasFullName(data)
}

export function completeProfileHref(returnTo: string) {
  return authHref('/auth/complete-profile', returnTo)
}
