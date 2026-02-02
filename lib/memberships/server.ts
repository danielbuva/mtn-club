import { connection } from 'next/server'
import { fetchActiveMembership } from '@/lib/memberships/queries'
import { isLeaderRole, type MembershipState } from '@/lib/memberships/types'
import { createClient } from '@/lib/supabase/server'

export async function getMembershipState(): Promise<MembershipState> {
  connection()
  const supabase = await createClient()

  try {
    const result = await fetchActiveMembership(supabase)

    return {
      isAuthenticated: !!result.userId,
      isLeader: !!result.membership && isLeaderRole(result.membership.role),
      membershipId: result.membership?.id ?? null,
      clubId: result.membership?.club_id ?? null,
      error: null,
    }
  } catch (error: unknown) {
    return {
      isAuthenticated: false,
      isLeader: false,
      membershipId: null,
      clubId: null,
      error:
        error instanceof Error ? error.message : 'Unable to load membership',
    }
  }
}
