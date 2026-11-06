import type { TripDetail } from '@/lib/trips/types'
import { FieldLabel, TripSection } from './trip-section'

type TripRequirementsProps = {
  trip: TripDetail
}

function Checklist({ label, items }: { label: string; items: string[] }) {
  return (
    <div className="space-y-2">
      <FieldLabel>{label}</FieldLabel>
      <ul className="divide-y divide-border border-y border-border">
        {items.map(item => (
          <li key={item} className="flex gap-3 py-2 text-base leading-6">
            <span aria-hidden="true" className="shrink-0 text-muted-foreground">
              –
            </span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

export function TripRequirements({ trip }: TripRequirementsProps) {
  const requirements = trip.requirements ?? []
  const gear = trip.gearList ?? []
  if (!requirements.length && !gear.length) return null

  return (
    <TripSection id="trip-gear" title="Requirements & gear">
      <div className="grid gap-6 md:grid-cols-2">
        {requirements.length ? (
          <Checklist label="Required" items={requirements} />
        ) : null}
        {gear.length ? (
          <Checklist label="Recommended gear" items={gear} />
        ) : null}
      </div>
    </TripSection>
  )
}
