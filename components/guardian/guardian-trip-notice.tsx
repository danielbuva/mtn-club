import Link from 'next/link'
import { tripGuardianPresentation } from '@/lib/guardian/presentation'
import { getMyGuardianStatus } from '@/lib/guardian/server'
import { Eyebrow, GuardianTag } from './ui'

/** Trip page summary for members under 18. Renders nothing for everyone else. */
export async function GuardianTripNotice({ tripId }: { tripId: string }) {
  const status = await getMyGuardianStatus(tripId)
  if (!status?.minor || !status.trip || status.trip === 'legacy') return null
  const view = tripGuardianPresentation(status.trip, status)
  return (
    <section
      aria-labelledby="trip-guardian-heading"
      className="space-y-3 border-t border-foreground/80 pt-5"
    >
      <div className="flex flex-wrap items-center gap-3">
        <Eyebrow>Guardian permission</Eyebrow>
        <GuardianTag label={view.label} tone={view.tone} />
      </div>
      <h2
        id="trip-guardian-heading"
        className="font-brand text-2xl font-bold uppercase leading-none tracking-wide"
      >
        {view.headline}
      </h2>
      <p className="text-base leading-7">{view.body}</p>
      {view.tone !== 'ready' && (
        <Link
          href={`/trips/${tripId}/rsvp`}
          className="inline-flex min-h-11 items-center underline underline-offset-4"
        >
          {status.trip === 'waiting_for_guardian'
            ? 'See request status'
            : view.canRequest
              ? 'Get your guardian’s signature'
              : 'Open your registration'}
        </Link>
      )}
    </section>
  )
}
