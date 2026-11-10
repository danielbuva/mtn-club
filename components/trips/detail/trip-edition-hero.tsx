import { ExpeditionPoster } from '@/components/editorial/expedition-poster'
import type { TripEdition } from '@/lib/editorial/editions'
import { formatDateOnly } from '@/lib/events/formatters'
import { formatScheduleDate } from '@/lib/events/schedule'
import { isTripPast } from '@/lib/trips/is-trip-past'
import type { TripDetail } from '@/lib/trips/types'

export function TripEditionHero({
  trip,
  edition,
}: {
  trip: TripDetail
  edition: TripEdition
}) {
  const canceled = trip.status === 'cancelled'
  // The reader page awaits request data; this server component is not cached.
  const past = isTripPast(trip, Date.now())
  const timeZone = trip.timeZone ?? 'America/Los_Angeles'
  const dateLabel = formatScheduleDate(
    formatDateOnly(trip.startAt, timeZone),
    trip.endAt ? formatDateOnly(trip.endAt, timeZone) : undefined,
  )

  if (edition.level === 'feature') return null

  return (
    <ExpeditionPoster
      edition={edition}
      title={trip.title}
      place={trip.locationName}
      dateLabel={dateLabel}
      status={canceled ? 'canceled' : past ? 'past' : undefined}
      size="hero"
    />
  )
}
