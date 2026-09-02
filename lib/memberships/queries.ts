import type { SupabaseClient } from '@supabase/supabase-js'
import type { MembershipRow } from '@/lib/memberships/types'
import type { Database } from '@/lib/supabase/types'

export type MembershipLookup = {
  userId: string | null
  membership: Pick<MembershipRow, 'user_id' | 'role' | 'status'> | null
}

export async function fetchActiveMembership(
  client: SupabaseClient<Database>,
): Promise<MembershipLookup> {
  const { data: authData, error: authError } = await client.auth.getUser()

  if (authError) {
    throw authError
  }

  if (!authData.user) {
    return { userId: null, membership: null }
  }

  const { data, error } = await client
    .from('memberships')
    .select('user_id, role, status')
    .eq('user_id', authData.user.id)
    .eq('status', 'active')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (error) {
    throw error
  }

  return {
    userId: authData.user.id,
    membership: data ?? null,
  }
}
