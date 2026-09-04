import {
  BadgeCheck,
  Bell,
  ChevronDown,
  CircleAlert,
  Clock3,
  Users,
} from 'lucide-react'
import { confirmGuardianConsentAction } from '@/app/(admin)/admin/membership/actions'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  getApplicantClaimTimestamp,
  type MembershipReviewAccount,
} from '@/lib/admin/membership-review'
import { decodeMembershipInterests } from '@/lib/memberships/application-options'
import type { Database } from '@/lib/supabase/types'
import { MembershipStatusForm } from './membership-status-form'

type Payment = Database['public']['Tables']['membership_zelle_payments']['Row']

type MembershipReviewPanelProps = {
  applications: MembershipReviewAccount[]
  payments: Payment[]
  canConfirmGuardian: boolean
  canReviewPayment: boolean
  canGrantComplimentary: boolean
  isSuperAdmin: boolean
  emptyMessage?: string
}

const formatDate = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: 'America/Los_Angeles',
      }).format(new Date(value))
    : 'Not available'

const paymentStatusLabel = (payment: Payment | undefined) => {
  if (!payment || payment.status === 'claimed') return 'Pending'
  if (payment.status === 'confirmed') return 'Accepted'
  if (payment.status === 'rejected') return 'Rejected'
  return 'Reversed'
}

const paymentSelectValue = (payment: Payment | undefined) => {
  if (payment?.status === 'confirmed') return 'accepted'
  if (payment?.status === 'rejected') return 'rejected'
  return 'pending'
}

export function MembershipReviewPanel({
  applications,
  payments,
  canConfirmGuardian,
  canReviewPayment,
  canGrantComplimentary,
  isSuperAdmin,
  emptyMessage,
}: MembershipReviewPanelProps) {
  const paymentsByUser = new Map<string, Payment[]>()
  for (const payment of payments) {
    const existing = paymentsByUser.get(payment.user_id) ?? []
    existing.push(payment)
    paymentsByUser.set(payment.user_id, existing)
  }

  if (!applications.length) {
    return <EmptyApplications message={emptyMessage} />
  }

  return (
    <section className="grid min-w-0 gap-4 overflow-hidden">
      {applications.map(application => {
        const userPayments = paymentsByUser.get(application.user_id) ?? []
        const currentPayment = userPayments[0]
        const applicantClaim = userPayments.find(
          payment => payment.claim_source !== 'admin',
        )
        const claimedAt = getApplicantClaimTimestamp(
          application,
          applicantClaim,
        )
        const applicantReportedPayment = Boolean(
          (application.dues_payment_claimed &&
            !userPayments.some(payment => payment.claim_source === 'admin')) ||
            applicantClaim,
        )
        const acceptedStatusLocked =
          currentPayment?.status === 'confirmed' && !isSuperAdmin

        return (
          <details
            key={application.user_id}
            className="group min-w-0 overflow-hidden border border-[#211D18]/15 bg-white/45 dark:border-border dark:bg-card"
          >
            <summary className="flex cursor-pointer list-none flex-col items-stretch gap-3 bg-[#E9DDC3]/70 px-4 py-4 outline-none focus-visible:ring-2 focus-visible:ring-ring sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-5 dark:bg-secondary [&::-webkit-details-marker]:hidden">
              <div className="min-w-0">
                <h2 className="break-all text-lg font-semibold">
                  {application.full_name}
                </h2>
                <p className="break-all text-sm text-[#6A5146] dark:text-muted-foreground sm:truncate">
                  {application.contact_email}
                </p>
              </div>
              <div className="flex min-w-0 flex-wrap items-center gap-2 sm:shrink-0 sm:flex-nowrap">
                <Badge variant="outline">{application.status}</Badge>
                <Badge
                  variant={
                    currentPayment?.status === 'confirmed'
                      ? 'default'
                      : 'secondary'
                  }
                >
                  Payment {paymentStatusLabel(currentPayment).toLowerCase()}
                </Badge>
                <ChevronDown
                  className="ml-auto size-4 shrink-0 transition-transform group-open:rotate-180 motion-reduce:transition-none"
                  aria-hidden="true"
                />
              </div>
            </summary>

            <div className="min-w-0 p-4 sm:p-5">
              <p className="text-xs text-[#6A5146] dark:text-muted-foreground">
                {application.status === 'account'
                  ? 'Account created'
                  : 'Applied'}{' '}
                {formatDate(application.created_at)}
              </p>

              <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-3">
                <div>
                  <dt className="text-[#6A5146] dark:text-muted-foreground">
                    Age
                  </dt>
                  <dd className="font-medium">
                    {application.age_status === null
                      ? 'Not provided'
                      : application.age_status === 'adult'
                        ? '18 or older'
                        : 'Minor'}
                  </dd>
                </div>
                <div>
                  <dt className="text-[#6A5146] dark:text-muted-foreground">
                    Guardian
                  </dt>
                  <dd className="font-medium">
                    {application.guardian_consent?.replaceAll('_', ' ') ??
                      'Not provided'}
                  </dd>
                </div>
                <div>
                  <dt className="text-[#6A5146] dark:text-muted-foreground">
                    Interests
                  </dt>
                  <dd className="font-medium">
                    {application.primary_interest
                      ? decodeMembershipInterests(
                          application.primary_interest,
                        ).join(', ')
                      : 'Not provided'}
                  </dd>
                </div>
              </dl>

              {application.experience_notes ? (
                <p className="mt-4 bg-[#E9DDC3]/70 p-4 text-sm dark:bg-secondary">
                  {application.experience_notes}
                </p>
              ) : null}

              <div className="mt-4 grid gap-2 border-l-2 border-[#211D18]/20 pl-3 text-xs text-[#6A5146] dark:border-border dark:text-muted-foreground">
                <p className="flex items-start gap-2">
                  {applicantReportedPayment ? (
                    <BadgeCheck className="mt-0.5 size-4 shrink-0" />
                  ) : (
                    <Clock3 className="mt-0.5 size-4 shrink-0" />
                  )}
                  {applicantReportedPayment
                    ? `Applicant reported sending a Zelle payment${claimedAt ? ` on ${formatDate(claimedAt)}` : ' (claim date not recorded)'}.`
                    : 'Applicant has not reported sending a Zelle payment.'}
                </p>
                <p className="flex items-start gap-2">
                  <Bell className="mt-0.5 size-4 shrink-0" />
                  Payment decisions are shown to the applicant on their
                  membership page.
                </p>
              </div>

              <div className="mt-5 flex flex-wrap gap-3 border-t border-[#211D18]/10 pt-5 dark:border-border">
                {application.guardian_consent === 'pending' &&
                canConfirmGuardian ? (
                  <form action={confirmGuardianConsentAction}>
                    <input
                      type="hidden"
                      name="applicantId"
                      value={application.user_id}
                    />
                    <Button size="sm" variant="outline">
                      Confirm guardian consent
                    </Button>
                  </form>
                ) : null}

                {canReviewPayment || canGrantComplimentary ? (
                  <MembershipStatusForm
                    applicantId={application.user_id}
                    defaultPaymentStatus={
                      canReviewPayment
                        ? paymentSelectValue(currentPayment)
                        : 'complimentary'
                    }
                    defaultNote={currentPayment?.internal_note ?? ''}
                    canReviewPayment={canReviewPayment}
                    canGrantComplimentary={canGrantComplimentary}
                    disabled={acceptedStatusLocked}
                  />
                ) : null}

                {acceptedStatusLocked ? (
                  <p className="flex items-center gap-2 text-xs text-amber-800 dark:text-amber-300">
                    <CircleAlert className="size-4" /> Only a super admin can
                    change an accepted payment.
                  </p>
                ) : null}
              </div>
            </div>
          </details>
        )
      })}
    </section>
  )
}

function EmptyApplications({ message }: { message?: string }) {
  return (
    <div className="border border-dashed border-[#211D18]/20 p-12 text-center text-sm text-[#6A5146] dark:border-border dark:text-muted-foreground">
      <Users className="mx-auto mb-3 size-6" aria-hidden="true" />
      {message ?? 'No accounts or membership applications yet.'}
    </div>
  )
}
