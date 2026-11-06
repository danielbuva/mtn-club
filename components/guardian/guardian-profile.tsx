import Link from 'next/link'
import {
  coverageEnd,
  type GuardianPresentation,
  membershipPresentation,
  waiverDate,
  waiverGuardianPresentation,
} from '@/lib/guardian/presentation'
import type { GuardianStatus } from '@/lib/guardian/schema'
import { ChangeGuardian, GuardianPhone } from './guardian-profile-actions'
import { GuardianRequestPanel } from './guardian-request-panel'
import { FactRow, GuardianTag } from './ui'

const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'America/Los_Angeles',
  })

/** Membership-only needs still get the request actions. */
function profilePresentation(status: GuardianStatus): GuardianPresentation {
  const waiver = waiverGuardianPresentation(status)
  if (
    status.membership === 'needs_signature' &&
    !waiver.canRequest &&
    waiver.tone === 'ready'
  )
    return {
      label: 'Needs guardian',
      tone: 'action',
      headline: 'Membership needs your guardian.',
      body: 'Your activity waiver is set. Your membership still needs a parent or guardian’s permission.',
      canRequest: true,
    }
  return waiver
}

function Section({
  id,
  title,
  children,
}: {
  id: string
  title: string
  children: React.ReactNode
}) {
  return (
    <section
      aria-labelledby={id}
      className="space-y-4 border-t border-foreground/80 pt-5"
    >
      <h2
        id={id}
        className="font-brand text-2xl font-bold uppercase leading-none tracking-wide"
      >
        {title}
      </h2>
      {children}
    </section>
  )
}

export function GuardianProfile({ status }: { status: GuardianStatus }) {
  if (!status.minor)
    return (
      <Section id="guardian-none" title="No guardian needed">
        <p className="max-w-xl text-base leading-7">
          You’re 18 or older, so you sign your own waiver. If your age on file
          is wrong, contact an officer.
        </p>
        <Link
          className="inline-flex min-h-11 items-center underline underline-offset-4"
          href="/profile/events/liability-waiver"
        >
          Go to your liability waiver
        </Link>
      </Section>
    )
  const presentation = profilePresentation(status)
  const membership = membershipPresentation(status.membership)
  const waiverTag = waiverGuardianPresentation(status)
  const guardian = status.guardian
  return (
    <div className="space-y-10">
      <GuardianRequestPanel
        status={status}
        presentation={presentation}
        tripId={null}
        compact
      />
      <Section id="guardian-saved" title="Your guardian">
        {guardian ? (
          <>
            <dl className="border-y border-border">
              <FactRow label="Name">{guardian.name}</FactRow>
              <FactRow label="Relationship">{guardian.relationship}</FactRow>
              <FactRow label="Email">
                <span className="block">{guardian.email}</span>
                <span className="text-sm text-muted-foreground">
                  {guardian.emailVerifiedAt
                    ? `Confirmed by code ${shortDate(guardian.emailVerifiedAt)}`
                    : 'Not confirmed yet'}
                </span>
              </FactRow>
              <FactRow label="Phone">
                <GuardianPhone phone={guardian.phone} />
              </FactRow>
              <FactRow label="Club check">
                {guardian.officerVerifiedAt ? (
                  <span>
                    <GuardianTag label="Verified" tone="ready" />{' '}
                    <span className="text-sm text-muted-foreground">
                      An officer checked identity and authority{' '}
                      {shortDate(guardian.officerVerifiedAt)}.
                    </span>
                  </span>
                ) : (
                  <span className="text-muted-foreground">
                    Not reviewed yet
                  </span>
                )}
              </FactRow>
            </dl>
            <ChangeGuardian guardian={guardian} />
          </>
        ) : (
          <p className="text-base leading-7 text-muted-foreground">
            No guardian saved yet. The first time one signs, their details are
            saved here so they won’t have to retype them.
          </p>
        )}
      </Section>
      <Section id="guardian-permissions" title="Permissions">
        <dl className="border-y border-border">
          {membership && (
            <FactRow label="Membership">
              <span className="flex flex-col items-start gap-1">
                <GuardianTag label={membership.label} tone={membership.tone} />
                <span className="text-sm leading-6 text-muted-foreground">
                  {membership.body}
                </span>
              </span>
            </FactRow>
          )}
          <FactRow label="Activities">
            <span className="flex flex-col items-start gap-1">
              <GuardianTag label={waiverTag.label} tone={waiverTag.tone} />
              {status.waiver.validUntil && (
                <span className="text-sm leading-6">
                  You’re covered through{' '}
                  {coverageEnd(
                    status.waiver.validUntil,
                    status.waiver.current?.until,
                  )}
                  {status.waiver.signerName
                    ? ` · signed by ${status.waiver.signerName}`
                    : ''}
                </span>
              )}
              {status.waiver.current && (
                <span className="text-sm leading-6 text-muted-foreground">
                  Waiver year (v{status.waiver.current.version}) covers{' '}
                  {status.waiver.current.activities.join(', ')},{' '}
                  {waiverDate(status.waiver.current.from)} –{' '}
                  {waiverDate(status.waiver.current.until)}. Other activities
                  need their own waiver.
                </span>
              )}
            </span>
          </FactRow>
        </dl>
        <Link
          className="inline-flex min-h-11 items-center underline underline-offset-4"
          href="/profile/events/liability-waiver"
        >
          See signed documents and history
        </Link>
      </Section>
    </div>
  )
}

export function GuardianProfileSkeleton() {
  return (
    <output
      aria-label="Loading guardian permission"
      className="block space-y-10"
    >
      <span className="block space-y-5 border-t border-foreground/80 pt-5">
        <span className="block h-6 w-28 animate-pulse bg-muted" />
        <span className="block h-8 w-3/4 animate-pulse bg-muted" />
        <span className="block h-5 w-full max-w-xl animate-pulse bg-muted" />
        <span className="grid gap-3 sm:grid-cols-2">
          <span className="block h-16 animate-pulse bg-muted" />
          <span className="block h-16 animate-pulse bg-muted" />
        </span>
      </span>
      {[0, 1].map(section => (
        <span
          key={section}
          className="block space-y-4 border-t border-foreground/80 pt-5"
        >
          <span className="block h-7 w-48 animate-pulse bg-muted" />
          <span className="block border-y border-border">
            {[0, 1, 2].map(row => (
              <span
                key={row}
                className="grid grid-cols-[7.5rem_minmax(0,1fr)] gap-3 border-t border-border py-3 first:border-t-0 sm:grid-cols-[9rem_minmax(0,1fr)]"
              >
                <span className="block h-4 w-20 animate-pulse bg-muted" />
                <span className="block h-5 animate-pulse bg-muted" />
              </span>
            ))}
          </span>
        </span>
      ))}
    </output>
  )
}
