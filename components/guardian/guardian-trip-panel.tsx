import { tripGuardianPresentation } from '@/lib/guardian/presentation'
import { getMyGuardianStatus } from '@/lib/guardian/server'
import { GuardianRequestPanel } from './guardian-request-panel'
import { Notice } from './ui'

/** Server wrapper: loads the minor's guardian status for one trip. */
export async function GuardianTripPanel({ tripId }: { tripId: string }) {
  const status = await getMyGuardianStatus(tripId)
  if (!status)
    return (
      <Notice tone="error">
        Guardian status didn’t load. Refresh the page; your registration answers
        are safe.
      </Notice>
    )
  if (!status.minor || !status.trip || status.trip === 'legacy') return null
  return (
    <GuardianRequestPanel
      status={status}
      presentation={tripGuardianPresentation(status.trip, status)}
      tripId={tripId}
    />
  )
}

/** Matches GuardianRequestPanel: rule, eyebrow + tag, headline, body, two choices. */
export function GuardianPanelSkeleton() {
  return (
    <output
      aria-label="Loading guardian permission"
      className="block space-y-5 border-t border-foreground/80 pt-5"
    >
      <span className="flex gap-3">
        <span className="block h-5 w-40 animate-pulse bg-muted" />
        <span className="block h-6 w-28 animate-pulse bg-muted" />
      </span>
      <span className="block space-y-2">
        <span className="block h-8 w-3/4 animate-pulse bg-muted" />
        <span className="block h-5 w-full max-w-xl animate-pulse bg-muted" />
        <span className="block h-5 w-2/3 max-w-xl animate-pulse bg-muted" />
      </span>
      <span className="grid gap-3 sm:grid-cols-2">
        <span className="block h-16 animate-pulse bg-muted" />
        <span className="block h-16 animate-pulse bg-muted" />
      </span>
    </output>
  )
}
