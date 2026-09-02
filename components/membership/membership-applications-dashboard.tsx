import { BadgeCheck, CircleAlert, Clock3 } from 'lucide-react'
import {
  confirmGuardianConsentAction,
  confirmMembershipApplicationAction,
} from '@/app/(site)/admin/membership/actions'
import { Button } from '@/components/ui/button'

export type MembershipApplicationReviewItem = {
  userId: string
  fullName: string
  contactEmail: string
  ageStatus: 'adult' | 'minor'
  guardianConsent: 'not_required' | 'pending' | 'confirmed'
  duesPaymentClaimed: boolean
  interests: string[]
  experienceNotes: string | null
  status: 'submitted' | 'confirmed' | 'withdrawn'
  confirmedAt: string | null
  createdAt: string
}

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))

function ReadinessList({ item }: { item: MembershipApplicationReviewItem }) {
  const consentReady =
    item.ageStatus === 'adult' || item.guardianConsent === 'confirmed'
  const checks = [
    {
      label: 'Applicant marked Zelle dues paid',
      ready: item.duesPaymentClaimed,
    },
    { label: 'Age or guardian consent cleared', ready: consentReady },
  ]

  return (
    <ul className="mt-5 grid gap-2 text-sm sm:grid-cols-2">
      {checks.map(check => (
        <li
          key={check.label}
          className="flex items-center gap-2 rounded-xl bg-muted/55 px-3 py-2"
        >
          {check.ready ? (
            <BadgeCheck
              className="size-4 text-emerald-700"
              aria-hidden="true"
            />
          ) : (
            <Clock3 className="size-4 text-amber-700" aria-hidden="true" />
          )}
          {check.label}
        </li>
      ))}
    </ul>
  )
}

export function MembershipApplicationsDashboard({
  applications,
}: {
  applications: MembershipApplicationReviewItem[]
}) {
  return (
    <section className="mt-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold">Zelle sign-ups</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Cross-reference paid declarations with the club&apos;s Zelle
            activity. Confirmation creates the full 12-month membership term.
          </p>
        </div>
        <span className="rounded-full bg-secondary px-3 py-1 text-sm font-semibold">
          {applications.length} total
        </span>
      </div>

      {applications.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
          No membership applications yet.
        </div>
      ) : (
        <div className="mt-6 space-y-5">
          {applications.map(item => {
            const consentReady =
              item.ageStatus === 'adult' || item.guardianConsent === 'confirmed'
            const canConfirm =
              item.status === 'submitted' &&
              item.duesPaymentClaimed &&
              consentReady

            return (
              <article
                key={item.userId}
                className="rounded-2xl border border-border bg-card p-6 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold">{item.fullName}</h3>
                    <a
                      href={`mailto:${item.contactEmail}`}
                      className="mt-1 block text-sm text-muted-foreground underline underline-offset-4"
                    >
                      {item.contactEmail}
                    </a>
                    <p className="mt-2 text-xs uppercase tracking-wider text-muted-foreground">
                      Applied {formatDate(item.createdAt)}
                    </p>
                  </div>
                  <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold uppercase tracking-wide">
                    {item.status}
                  </span>
                </div>

                <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-3">
                  <div>
                    <dt className="text-muted-foreground">Age</dt>
                    <dd className="mt-1 font-medium">
                      {item.ageStatus === 'adult' ? '18 or older' : 'Minor'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Guardian consent</dt>
                    <dd className="mt-1 font-medium">
                      {item.guardianConsent.replaceAll('_', ' ')}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Interests</dt>
                    <dd className="mt-1 font-medium">
                      {item.interests.join(', ')}
                    </dd>
                  </div>
                </dl>

                {item.experienceNotes && (
                  <p className="mt-5 rounded-xl bg-muted/55 p-4 text-sm leading-6">
                    {item.experienceNotes}
                  </p>
                )}

                <ReadinessList item={item} />

                {item.status === 'submitted' && (
                  <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-border pt-5">
                    {item.ageStatus === 'minor' &&
                      item.guardianConsent === 'pending' && (
                        <form action={confirmGuardianConsentAction}>
                          <input
                            type="hidden"
                            name="applicantId"
                            value={item.userId}
                          />
                          <Button type="submit" size="sm" variant="outline">
                            Confirm guardian consent
                          </Button>
                        </form>
                      )}
                    <form action={confirmMembershipApplicationAction}>
                      <input
                        type="hidden"
                        name="applicantId"
                        value={item.userId}
                      />
                      <Button type="submit" size="sm" disabled={!canConfirm}>
                        Confirm as member
                      </Button>
                    </form>
                    {!canConfirm && (
                      <p className="flex items-center gap-2 text-xs text-muted-foreground">
                        <CircleAlert className="size-4" aria-hidden="true" />
                        Complete every check before confirming membership.
                      </p>
                    )}
                  </div>
                )}

                {item.status === 'confirmed' && item.confirmedAt && (
                  <p className="mt-5 border-t border-border pt-5 text-sm text-emerald-800">
                    Membership confirmed {formatDate(item.confirmedAt)}.
                  </p>
                )}
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}
