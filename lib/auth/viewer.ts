import { createClient } from '@/lib/supabase/server'
import type { MembershipRow } from '@/lib/memberships/types'
import type { ProfileRow } from '@/lib/profile/types'
import { connection } from 'next/server'

export type MemberSummary = {
  fullName?: string | null
  avatarUrl?: string | null
  joinedOn?: string | null
  expiresAt?: string | null
  autoRenew?: boolean | null
  role?: MembershipRow['role'] | null
}

export type Viewer = {
  isAuthenticated: boolean
  userId: string | null
  email?: string | null
  isMember: boolean
  member?: MemberSummary | null
}

type MembershipSummaryRow = Pick<
  MembershipRow,
  | 'id'
  | 'club_id'
  | 'role'
  | 'state'
  | 'is_member'
  | 'joined_on'
  | 'membership_start'
  | 'membership_end'
  | 'auto_renew'
>

type ProfileSummaryRow = Pick<
  ProfileRow,
  'id' | 'first_name' | 'last_name' | 'display_name' | 'avatar_url' | 'email'
>

const buildFullName = (profile: ProfileSummaryRow | null): string | null => {
  if (!profile) return null
  const displayName = profile.display_name?.trim()
  if (displayName) return displayName
  const parts = [profile.first_name, profile.last_name]
    .map((value) => value?.trim())
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
      userId: null,
      email: null,
      isMember: false,
      member: null,
    }
  }

  const user = authData.user

  const [profileResult, membershipResult] = await Promise.all([
    supabase
      .from('app_users')
      .select('id, first_name, last_name, display_name, avatar_url, email')
      .eq('id', user.id)
      .maybeSingle(),
    supabase
      .from('club_memberships')
      .select(
        'id, club_id, role, state, is_member, joined_on, membership_start, membership_end, auto_renew'
      )
      .eq('user_id', user.id)
      .eq('state', 'active')
      .eq('is_member', true)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle(),
  ])

  if (profileResult.error) {
    console.error('Error loading viewer profile:', profileResult.error)
  }

  if (membershipResult.error) {
    console.error('Error loading viewer membership:', membershipResult.error)
  }

  const profile = (profileResult.data as ProfileSummaryRow | null) ?? null
  const membership = (membershipResult.data as MembershipSummaryRow | null) ?? null
  const fullName = buildFullName(profile)

  const isMember = !!membership

  return {
    isAuthenticated: true,
    userId: user.id,
    email: user.email ?? profile?.email ?? null,
    isMember,
    member: isMember
      ? {
          fullName,
          avatarUrl: profile?.avatar_url ?? null,
          joinedOn: membership?.joined_on ?? membership?.membership_start ?? null,
          expiresAt: membership?.membership_end ?? null,
          autoRenew: membership?.auto_renew ?? null,
          role: membership?.role,
        }
      : null,
  }
}
