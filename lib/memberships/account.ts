import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export type SafePaymentHistoryItem = {
  paymentDate: string | null
  amountCents: number
  currency: string
  status: string
  grantedStartsAt: string | null
  grantedEndsAt: string | null
  receiptUrl: string | null
}

type SafePaymentHistoryRpcRow = {
  payment_date: string | null
  amount_cents: number
  currency: string
  public_status: string
  granted_starts_at: string | null
  granted_ends_at: string | null
  receipt_url: string | null
}

export type MembershipAccount = {
  schemaReady: boolean
  restriction: 'normal' | 'suspended' | 'banned'
  accessActive: boolean
  accessExpiresAt: string | null
  provisionalAccess: boolean
  hasExpiredEntitlement: boolean
  checkoutProcessing: boolean
  reviewRequired: boolean
  application: {
    status: 'submitted' | 'confirmed' | 'withdrawn'
    ageStatus: 'adult' | 'minor'
    guardianConsent: 'not_required' | 'pending' | 'confirmed'
    duesPaymentClaimed: boolean
    primaryInterest: string
    updatedAt: string
  } | null
  paymentHistory: SafePaymentHistoryItem[]
}

export const unavailableMembershipAccount: MembershipAccount = {
  schemaReady: false,
  restriction: 'normal',
  accessActive: false,
  accessExpiresAt: null,
  provisionalAccess: false,
  hasExpiredEntitlement: false,
  checkoutProcessing: false,
  reviewRequired: false,
  application: null,
  paymentHistory: [],
}

export async function getMembershipAccount(
  userId: string,
): Promise<MembershipAccount> {
  try {
    return await loadMembershipAccount(userId)
  } catch (error: unknown) {
    console.error('Membership account data is unavailable:', error)
    return unavailableMembershipAccount
  }
}

async function loadMembershipAccount(
  userId: string,
): Promise<MembershipAccount> {
  const admin = createAdminClient()
  const supabase = await createClient()
  const now = new Date().toISOString()

  const [
    restriction,
    entitlements,
    activeOverride,
    checkout,
    review,
    application,
    history,
  ] = await Promise.all([
    admin
      .from('membership_account_restrictions')
      .select('restriction')
      .eq('user_id', userId)
      .maybeSingle(),
    admin
      .from('membership_entitlements')
      .select('starts_at, ends_at, revoked_at')
      .eq('user_id', userId)
      .is('revoked_at', null)
      .order('ends_at', { ascending: false }),
    admin
      .from('membership_access_overrides')
      .select('starts_at, ends_at')
      .eq('user_id', userId)
      .is('revoked_at', null)
      .lte('starts_at', now)
      .or(`ends_at.is.null,ends_at.gt.${now}`)
      .order('starts_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    admin
      .from('membership_checkout_attempts')
      .select('status, expires_at')
      .eq('user_id', userId)
      .in('status', ['open', 'review_required'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    admin
      .from('membership_review_items')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'pending')
      .limit(1)
      .maybeSingle(),
    admin
      .from('membership_applications')
      .select(
        'status, age_status, guardian_consent, dues_payment_claimed, primary_interest, updated_at',
      )
      .eq('user_id', userId)
      .maybeSingle(),
    supabase.rpc('get_my_membership_payment_history'),
  ])

  if (
    restriction.error ||
    entitlements.error ||
    activeOverride.error ||
    checkout.error ||
    review.error ||
    application.error ||
    history.error
  ) {
    return unavailableMembershipAccount
  }

  const restrictionState = restriction.data?.restriction ?? 'normal'
  const currentEntitlement = (entitlements.data ?? []).find(
    entitlement => entitlement.starts_at <= now && entitlement.ends_at > now,
  )
  const latestEntitlement = entitlements.data?.[0] ?? null
  const hasOverride = Boolean(activeOverride.data)
  const accessActive =
    restrictionState === 'normal' &&
    (Boolean(currentEntitlement) || hasOverride)
  const provisionalAccess = Boolean(
    restrictionState === 'normal' &&
      application.data?.status === 'submitted' &&
      application.data.dues_payment_claimed &&
      (application.data.guardian_consent === 'not_required' ||
        application.data.guardian_consent === 'confirmed'),
  )

  return {
    schemaReady: true,
    restriction: restrictionState,
    accessActive,
    accessExpiresAt:
      currentEntitlement?.ends_at ?? activeOverride.data?.ends_at ?? null,
    provisionalAccess,
    hasExpiredEntitlement: Boolean(
      latestEntitlement && latestEntitlement.ends_at <= now,
    ),
    checkoutProcessing: Boolean(
      checkout.data?.status === 'open' && checkout.data.expires_at > now,
    ),
    reviewRequired: Boolean(
      review.data || checkout.data?.status === 'review_required',
    ),
    application: application.data
      ? {
          status: application.data.status,
          ageStatus: application.data.age_status,
          guardianConsent: application.data.guardian_consent,
          duesPaymentClaimed: application.data.dues_payment_claimed,
          primaryInterest: application.data.primary_interest,
          updatedAt: application.data.updated_at,
        }
      : null,
    paymentHistory: (history.data ?? []).map(
      (item: SafePaymentHistoryRpcRow) => ({
        paymentDate: item.payment_date,
        amountCents: item.amount_cents,
        currency: item.currency,
        status: item.public_status,
        grantedStartsAt: item.granted_starts_at,
        grantedEndsAt: item.granted_ends_at,
        receiptUrl: item.receipt_url,
      }),
    ),
  }
}
