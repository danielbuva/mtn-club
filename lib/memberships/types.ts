import type { Database } from '@/lib/supabase/types'

export type MembershipRow =
  Database['public']['Tables']['club_memberships']['Row']

export type MembershipState = {
  isAuthenticated: boolean
  isLeader: boolean
  membershipId: string | null
  clubId: string | null
  error: string | null
}

export const LEADER_ROLES = [
  'leader',
  'admin',
  'board',
  'founder',
  'staff',
] as const

export type LeaderRole = (typeof LEADER_ROLES)[number]

export function isLeaderRole(
  role: MembershipRow['role'] | null | undefined,
): boolean {
  return !!role && (LEADER_ROLES as readonly string[]).includes(role)
}
