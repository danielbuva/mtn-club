import { connection } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/types'

export type MemberSummary = {
  fullName?: string | null
  avatarUrl?: string | null
  joinedOn?: string | null
  expiresAt?: string | null
  autoRenew?: boolean | null
  role?: Database['public']['Enums']['club_role'] | null
}

export type Viewer = {
  isAuthenticated: boolean
  isAdmin: boolean
  canCreateEvent: boolean
  userId: string | null
  email?: string | null
  isMember: boolean
  canViewMemberContent: boolean
  membershipAccessLevel: 'none' | 'provisional' | 'full'
  membershipState: Database['public']['Enums']['membership_status'] | null
  membershipBannedAt: string | null
  member?: MemberSummary | null
}

type MembershipSummaryRow = Database['public']['Tables']['memberships']['Row']

type ProfileSummaryRow = Pick<
  Database['public']['Tables']['profiles']['Row'],
  'user_id' | 'first_name' | 'last_name' | 'display_name' | 'avatar_url'
>

const buildFullName = (profile: ProfileSummaryRow | null): string | null => {
  if (!profile) return null
  const displayName = profile.display_name?.trim()
  if (displayName) return displayName
  const parts = [profile.first_name, profile.last_name]
    .map(value => value?.trim())
    .filter((value): value is string => !!value)
  if (!parts.length) return null
  return parts.join(' ')
}

export async function getViewer(): Promise<Viewer> {
  connection()
  const supabase = await createClient()

  const { data: authData, error: authError } = await supabase.auth.getUser()
  if (authError || !authData.user) {
    return {
      isAuthenticated: false,
      isAdmin: false,
      canCreateEvent: false,
      userId: null,
      email: null,
      isMember: false,
      canViewMemberContent: false,
      membershipAccessLevel: 'none',
      membershipState: null,
      membershipBannedAt: null,
      member: null,
    }
  }

  const user = authData.user

  const [profileResult, membershipResult, accessResult, adminResult] =
    await Promise.all([
      supabase
        .from('profiles')
        .select('user_id, first_name, last_name, display_name, avatar_url')
        .eq('user_id', user.id)
        .maybeSingle(),
      supabase
        .from('memberships')
        .select('role, status, joined_on, member_since')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase.rpc('get_my_membership_access'),
      supabase.rpc('has_admin_capability', {
        p_uid: user.id,
        p_capability_key: 'overview.read',
      }),
    ])

  if (profileResult.error) {
    console.error('Error loading viewer profile:', profileResult.error)
  }

  if (membershipResult.error) {
    console.error('Error loading viewer membership:', membershipResult.error)
  }

  const profile = (profileResult.data as ProfileSummaryRow | null) ?? null
  const membership =
    (membershipResult.data as MembershipSummaryRow | null) ?? null
  const fullName = buildFullName(profile)
  const access = accessResult.data?.[0] ?? null
  const isMember = access?.access_active ?? membership?.status === 'active'
  const provisionalAccess = access?.provisional_access ?? false
  const restriction = access?.restriction
  const membershipState =
    restriction === 'suspended' || restriction === 'banned'
      ? restriction
      : isMember
        ? 'active'
        : (membership?.status ?? null)

  return {
    isAuthenticated: true,
    isAdmin: adminResult.data ?? false,
    canCreateEvent:
      Boolean(profile) && (isMember || (adminResult.data ?? false)),
    userId: user.id,
    email: user.email ?? null,
    isMember,
    canViewMemberContent: isMember || provisionalAccess,
    membershipAccessLevel: isMember
      ? 'full'
      : provisionalAccess
        ? 'provisional'
        : 'none',
    membershipState,
    membershipBannedAt: null,
    member: isMember
      ? {
          fullName,
          avatarUrl: profile?.avatar_url ?? null,
          joinedOn: membership?.member_since ?? membership?.joined_on ?? null,
          expiresAt: access?.expires_at ?? null,
          autoRenew: null,
          role: membership?.role,
        }
      : null,
  }
}
