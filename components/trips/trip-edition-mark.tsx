import { EditionLabel } from '@/components/editorial/edition-label'
import {
  getTripEdition,
  shortEditionLabel,
  type TripEdition,
} from '@/lib/editorial/editions'
import type { CalendarTrip } from '@/lib/events/types'
import { resolveActivityType } from '@/lib/trips/list-item'

/** Calendar dates are already local days; noon UTC keeps them stable in the club zone. */
export function getCalendarTripEdition(trip: CalendarTrip): TripEdition | null {
  return getTripEdition({
    id: trip.id,
    scheduleKey: trip.scheduleKey,
    isOfficial: trip.isOfficial,
    activityType: resolveActivityType(trip.tags),
    startAt: new Date(`${trip.dateStart}T12:00:00Z`),
    endAt: new Date(`${trip.dateEnd}T12:00:00Z`),
  })
}

export function TripEditionMark({ edition }: { edition: TripEdition | null }) {
  if (!edition) return null
  return (
    <EditionLabel
      variant="outline"
      className="inline-flex items-center gap-1.5 text-foreground"
    >
      {shortEditionLabel(edition)}
    </EditionLabel>
  )
}
