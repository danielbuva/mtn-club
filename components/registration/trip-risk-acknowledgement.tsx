import Link from 'next/link'
import type { TripRegistrationSnapshot } from '@/lib/registration/schema'
import { waiverDate } from './annual-waiver-intro'
export function TripRiskAcknowledgement({
  snapshot,
  acknowledged,
  onChange,
  error,
}: {
  snapshot: TripRegistrationSnapshot
  acknowledged: boolean
  onChange: (value: boolean) => void
  error?: string
}) {
  return (
    <div className="space-y-5">
      <p>This trip includes:</p>
      {snapshot.informedRisks ? (
        <ul className="list-disc space-y-3 pl-5">
          {snapshot.informedRisks.statements.map(statement => (
            <li key={statement}>{statement}</li>
          ))}
        </ul>
      ) : (
        <p>
          An organizer must add this trip’s informed risks before registration.
        </p>
      )}
      {snapshot.risksAcknowledged ? (
        <p>You acknowledged this revision of the trip’s risks.</p>
      ) : (
        <label className="flex min-h-12 items-start gap-3">
          <input
            className="mt-1 size-5"
            type="checkbox"
            checked={acknowledged}
            onChange={event => onChange(event.target.checked)}
            aria-invalid={Boolean(error)}
          />
          I understand these trip-specific risks and conditions.
        </label>
      )}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {snapshot.waiverSigned && snapshot.waiverCoverage ? (
        <p className="text-sm">
          Your annual UNLV RSO Liability Waiver is already valid through{' '}
          {waiverDate(snapshot.waiverCoverage.until)}. This acknowledgement is
          about the conditions of this trip — you are not signing the annual
          waiver again.
        </p>
      ) : (
        <p className="text-sm">
          This trip acknowledgement is separate from the annual liability
          waiver. Any required waiver must be valid before participation.
        </p>
      )}
      <Link className="underline" href="/profile/events/liability-waiver">
        View annual waiver
      </Link>
    </div>
  )
}
