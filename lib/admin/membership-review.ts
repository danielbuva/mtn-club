import type { Database } from '@/lib/supabase/types'

type Application = Pick<
  Database['public']['Tables']['membership_applications']['Row'],
  | 'user_id'
  | 'full_name'
  | 'contact_email'
  | 'age_status'
  | 'guardian_consent'
  | 'dues_payment_claimed'
  | 'dues_claimed_at'
  | 'primary_interest'
  | 'experience_notes'
  | 'status'
  | 'created_at'
>

export type MembershipReviewAccount = Omit<
  Application,
  'age_status' | 'guardian_consent' | 'primary_interest' | 'status'
> & {
  age_status: Application['age_status'] | null
  guardian_consent: Application['guardian_consent'] | null
  primary_interest: string | null
  status: Application['status'] | 'account'
}

type Account = { id: string; email?: string; created_at: string }

export function buildMembershipReviewAccounts(
  applications: Application[],
  accounts: Account[],
  profileNames: Map<string, string | null>,
): MembershipReviewAccount[] {
  const rows = new Map<string, MembershipReviewAccount>(
    applications.map(application => [application.user_id, application]),
  )
  for (const account of accounts) {
    if (rows.has(account.id)) continue
    rows.set(account.id, {
      user_id: account.id,
      full_name: profileNames.get(account.id) || account.email || 'Account',
      contact_email: account.email ?? '',
      age_status: null,
      guardian_consent: null,
      dues_payment_claimed: false,
      dues_claimed_at: null,
      primary_interest: null,
      experience_notes: null,
      status: 'account',
      created_at: account.created_at,
    })
  }
  return [...rows.values()].sort((a, b) =>
    b.created_at.localeCompare(a.created_at),
  )
}

export function getApplicantClaimTimestamp(
  application: Pick<
    MembershipReviewAccount,
    'dues_payment_claimed' | 'dues_claimed_at'
  >,
  payment?: { claimed_at: string },
): string | null {
  return (
    payment?.claimed_at ??
    (application.dues_payment_claimed ? application.dues_claimed_at : null)
  )
}
