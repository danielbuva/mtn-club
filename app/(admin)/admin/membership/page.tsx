import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { MembershipReviewPanel } from '@/components/admin/membership/membership-review-panel'
import {
  ActiveMembersPanel,
  MembershipExceptionsPanel,
} from '@/components/admin/membership/membership-secondary-panels'
import { MembershipTabs } from '@/components/admin/membership/membership-tabs'
import { requireAdminCapability } from '@/lib/admin/auth'
import { buildMembershipAccessSnapshot } from '@/lib/admin/membership-access'
import { createAdminClient } from '@/lib/supabase/admin'

type MembershipTab = 'review' | 'members' | 'exceptions'

const resolveDefaultTab = (tab: string | undefined): MembershipTab => {
  if (tab === 'members' || tab === 'exceptions') return tab
  return 'review'
}

export default async function AdminMembershipPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const context = await requireAdminCapability('membership.read')
  const { tab } = await searchParams
  const admin = createAdminClient()

  const [
    applicationsResult,
    paymentsResult,
    membershipsResult,
    entitlementsResult,
    overridesResult,
    restrictionsResult,
    reviewsResult,
    profilesResult,
  ] = await Promise.all([
    admin
      .from('membership_applications')
      .select(
        'user_id, full_name, contact_email, age_status, guardian_consent, dues_payment_claimed, primary_interest, experience_notes, status, created_at',
      )
      .order('created_at', { ascending: false }),
    admin
      .from('membership_zelle_payments')
      .select('*')
      .order('created_at', { ascending: false }),
    admin
      .from('memberships')
      .select('user_id, status, role, member_since, joined_on')
      .order('member_since', { ascending: false }),
    admin
      .from('membership_entitlements')
      .select(
        'user_id, starts_at, ends_at, revoked_at, payment_id, zelle_payment_id',
      ),
    admin
      .from('membership_access_overrides')
      .select('user_id, starts_at, ends_at, revoked_at'),
    admin
      .from('membership_account_restrictions')
      .select('user_id, restriction'),
    admin
      .from('membership_review_items')
      .select('id, user_id, reason_code, reason_detail, status, created_at')
      .in('status', ['pending', 'refund_requested'])
      .order('created_at'),
    admin.from('profiles').select('user_id, display_name'),
  ])

  const queryError = [
    applicationsResult,
    paymentsResult,
    membershipsResult,
    entitlementsResult,
    overridesResult,
    restrictionsResult,
    reviewsResult,
    profilesResult,
  ].find(result => result.error)?.error
  if (queryError) throw queryError

  const applications = applicationsResult.data ?? []
  const payments = paymentsResult.data ?? []
  const access = buildMembershipAccessSnapshot({
    entitlements: entitlementsResult.data ?? [],
    overrides: overridesResult.data ?? [],
    restrictions: restrictionsResult.data ?? [],
    now: new Date().toISOString(),
  })
  const memberships = (membershipsResult.data ?? [])
    .filter(item => access.activeUserIds.has(item.user_id))
    .map(item => ({
      ...item,
      member_since:
        access.firstActivationByUser.get(item.user_id)?.slice(0, 10) ??
        item.member_since,
    }))
  const reviews = reviewsResult.data ?? []
  const profileNames = new Map(
    (profilesResult.data ?? []).map(profile => [
      profile.user_id,
      profile.display_name,
    ]),
  )

  return (
    <div className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-8 lg:py-10">
      <AdminPageHeader
        title="Membership"
        description="Review applications, verify Zelle dues, and keep member access accurate."
      />

      <MembershipTabs
        defaultTab={resolveDefaultTab(tab)}
        reviewCount={applications.length}
        memberCount={memberships.length}
        exceptionCount={reviews.length}
        review={
          <MembershipReviewPanel
            applications={applications}
            payments={payments}
            canConfirmGuardian={Boolean(
              context.permissions['membership.confirm_guardian'],
            )}
            canReviewPayment={Boolean(
              context.permissions['membership.confirm_payment'],
            )}
            isSuperAdmin={context.isSuperAdmin}
          />
        }
        members={
          <ActiveMembersPanel
            memberships={memberships}
            profileNames={profileNames}
          />
        }
        exceptions={
          <MembershipExceptionsPanel
            reviews={reviews}
            profileNames={profileNames}
          />
        }
      />
    </div>
  )
}
