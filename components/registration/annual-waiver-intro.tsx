import type { TripRegistrationSnapshot } from '@/lib/registration/schema'
export function waiverDate(value: string) {
  return new Date(`${value}T12:00:00Z`).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  })
}
export function AnnualWaiverIntro({
  coverage,
}: {
  coverage: TripRegistrationSnapshot['waiverCoverage']
}) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-widest">
        Annual waiver
      </p>
      <p>
        You’re signing MTN Club’s annual UNLV waiver, not a waiver only for this
        trip. This recurring UNLV RSO Liability Waiver applies only to the
        outdoor-adventure activities listed below.
      </p>
      {coverage && (
        <>
          <p className="font-medium">
            Valid {waiverDate(coverage.from)} through{' '}
            {waiverDate(coverage.until)}
          </p>
          <ul className="list-disc pl-5">
            {coverage.activities.map(activity => (
              <li key={activity}>{activity}</li>
            ))}
          </ul>
          <p>
            You do not need to sign this same valid waiver again for every
            eligible trip during this period.
          </p>
        </>
      )}
      <p className="text-sm text-muted-foreground">
        UNLV permits recurring waivers for recurring activities during an
        academic year when the covered activities and risks are specifically
        identified.
      </p>
    </div>
  )
}
