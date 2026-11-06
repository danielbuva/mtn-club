import type { TripDetail } from '@/lib/trips/types'
import { FieldLabel, TripSection } from './trip-section'

type TripLogisticsProps = {
  trip: TripDetail
}

export function TripLogistics({ trip }: TripLogisticsProps) {
  const rows = [
    { label: 'Meetup', value: trip.locationNotes },
    { label: 'Itinerary', value: trip.itinerary },
    { label: 'Leader contact', value: trip.leaderContact },
  ].filter(row => Boolean(row.value?.trim()))
  if (!rows.length) return null

  return (
    <TripSection id="trip-logistics" title="Logistics">
      <dl className="grid max-w-prose gap-5">
        {rows.map(row => (
          <div key={row.label} className="space-y-1.5">
            <dt>
              <FieldLabel>{row.label}</FieldLabel>
            </dt>
            <dd className="whitespace-pre-line text-base leading-7">
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
    </TripSection>
  )
}
