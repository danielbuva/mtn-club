import type { TripDetail } from '@/lib/trips/types'

type TripRequirementsProps = {
  trip: TripDetail
}

export function TripRequirements({ trip }: TripRequirementsProps) {
  const hasRequirements = Boolean(trip.requirements?.length)
  const hasGear = Boolean(trip.gearList?.length)

  if (!hasRequirements && !hasGear) {
    return null
  }

  return (
    <section className="space-y-4 rounded-2xl border border-border/70 bg-card p-4 md:p-5">
      <h2 className="text-lg font-semibold">Requirements & Gear</h2>

      {hasRequirements ? (
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Requirements
          </p>
          <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            {trip.requirements?.map(item => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {hasGear ? (
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Gear checklist
          </p>
          <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            {trip.gearList?.map(item => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  )
}
