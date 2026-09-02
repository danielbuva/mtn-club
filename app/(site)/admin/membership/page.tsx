import { notFound, redirect } from 'next/navigation'
import {
  type MembershipApplicationReviewItem,
  MembershipApplicationsDashboard,
} from '@/components/membership/membership-applications-dashboard'
import { Button } from '@/components/ui/button'
import { getViewer } from '@/lib/auth/viewer'
import { decodeMembershipInterests } from '@/lib/memberships/application-options'
import { isLeaderRole } from '@/lib/memberships/types'
import { createAdminClient } from '@/lib/supabase/admin'
import { resolveMembershipReviewAction } from './actions'

export default async function MembershipReviewPage() {
  const viewer = await getViewer()
  if (!viewer.isAuthenticated || !viewer.userId) {
    redirect('/auth/login?redirect=%2Fadmin%2Fmembership')
  }
  if (!isLeaderRole(viewer.member?.role)) notFound()

  const admin = createAdminClient()
  const [applicationsResult, reviewsResult] = await Promise.all([
    admin
      .from('membership_applications')
      .select(
        'user_id, full_name, contact_email, age_status, guardian_consent, dues_payment_claimed, primary_interest, experience_notes, status, confirmed_at, created_at',
      )
      .order('created_at', { ascending: false }),
    admin
      .from('membership_review_items')
      .select(
        'id, user_id, payment_id, reason_code, reason_detail, status, created_at',
      )
      .in('status', ['pending', 'refund_requested'])
      .order('created_at', { ascending: true }),
  ])

  if (applicationsResult.error || reviewsResult.error) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-24">
        <h1 className="text-3xl font-semibold">Membership review</h1>
        <p className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm">
          The membership migration has not been deployed to this environment.
        </p>
      </main>
    )
  }

  const applications = (applicationsResult.data ?? []).map(application => ({
    userId: application.user_id,
    fullName: application.full_name,
    contactEmail: application.contact_email,
    ageStatus: application.age_status,
    guardianConsent: application.guardian_consent,
    duesPaymentClaimed: application.dues_payment_claimed,
    interests: decodeMembershipInterests(application.primary_interest),
    experienceNotes: application.experience_notes,
    status: application.status,
    confirmedAt: application.confirmed_at,
    createdAt: application.created_at,
  })) satisfies MembershipApplicationReviewItem[]

  const reviews = reviewsResult.data ?? []
  const userIds = [...new Set(reviews.map(review => review.user_id))]
  const paymentIds = reviews
    .map(review => review.payment_id)
    .filter((id): id is string => Boolean(id))
  const [profilesResult, paymentsResult] = await Promise.all([
    userIds.length
      ? admin
          .from('profiles')
          .select('user_id, display_name, first_name, last_name')
          .in('user_id', userIds)
      : Promise.resolve({ data: [], error: null }),
    paymentIds.length
      ? admin
          .from('membership_payments')
          .select('id, amount_cents, currency, paid_at, status')
          .in('id', paymentIds)
      : Promise.resolve({ data: [], error: null }),
  ])
  const profiles = new Map(
    (profilesResult.data ?? []).map(profile => [profile.user_id, profile]),
  )
  const payments = new Map(
    (paymentsResult.data ?? []).map(payment => [payment.id, payment]),
  )

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-24 sm:px-6">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        Officer tools
      </p>
      <h1 className="mt-3 text-4xl font-semibold">Membership review queue</h1>
      <p className="mt-3 max-w-2xl leading-7 text-muted-foreground">
        Review Zelle membership sign-ups and the exceptional Stripe cases kept
        for the future checkout system.
      </p>

      <MembershipApplicationsDashboard applications={applications} />

      <section className="mt-16">
        <h2 className="text-2xl font-semibold">Stripe exception queue</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          This remains available for the disabled Stripe skeleton and future
          refunds or disputes.
        </p>
        {reviews.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">
            No membership cases need review.
          </div>
        ) : (
          <div className="mt-10 space-y-5">
            {reviews.map(review => {
              const profile = profiles.get(review.user_id)
              const payment = review.payment_id
                ? payments.get(review.payment_id)
                : null
              const name =
                profile?.display_name ??
                [profile?.first_name, profile?.last_name]
                  .filter(Boolean)
                  .join(' ') ??
                'Member'

              return (
                <article
                  key={review.id}
                  className="rounded-2xl border border-border bg-card p-6 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold">{name || 'Member'}</p>
                      <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">
                        {review.reason_code.replaceAll('_', ' ')}
                      </p>
                    </div>
                    <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold">
                      {review.status.replaceAll('_', ' ')}
                    </span>
                  </div>
                  <p className="mt-4 text-sm leading-6 text-muted-foreground">
                    {review.reason_detail}
                  </p>
                  {payment && (
                    <p className="mt-3 text-sm">
                      {(payment.amount_cents / 100).toLocaleString('en-US', {
                        style: 'currency',
                        currency: payment.currency,
                      })}{' '}
                      · {payment.status.replaceAll('_', ' ')} ·{' '}
                      {payment.paid_at
                        ? new Date(payment.paid_at).toLocaleString()
                        : 'payment time unavailable'}
                    </p>
                  )}
                  {review.status === 'pending' && (
                    <form
                      action={resolveMembershipReviewAction}
                      className="mt-5 flex flex-wrap gap-2 border-t border-border pt-5"
                    >
                      <input type="hidden" name="reviewId" value={review.id} />
                      <Button name="resolution" value="approve" size="sm">
                        Approve one-year grant
                      </Button>
                      <Button
                        name="resolution"
                        value="refund"
                        size="sm"
                        variant="outline"
                      >
                        Issue full refund
                      </Button>
                      <Button
                        name="resolution"
                        value="dismiss"
                        size="sm"
                        variant="ghost"
                      >
                        Dismiss without access
                      </Button>
                    </form>
                  )}
                  {review.status === 'refund_requested' && (
                    <p className="mt-5 border-t border-border pt-5 text-sm text-muted-foreground">
                      Refund requested from Stripe. The signed refund webhook
                      will finalize the local record.
                    </p>
                  )}
                </article>
              )
            })}
          </div>
        )}
      </section>
    </main>
  )
}
