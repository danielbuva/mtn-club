import type { TripDetail } from '@/lib/trips/types'

type TripLogisticsProps = {
  trip: TripDetail
}

export function TripLogistics({ trip }: TripLogisticsProps) {
  if (!trip.locationNotes && !trip.itinerary && !trip.leaderContact) {
    return null
  }

  return (
    <section className="space-y-3 rounded-2xl border border-border/70 bg-card p-4 md:p-5">
      <h2 className="text-lg font-semibold">Logistics</h2>

      {trip.locationNotes ? (
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Meetup details
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {trip.locationNotes}
          </p>
        </div>
      ) : null}

      {trip.itinerary ? (
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Itinerary
          </p>
          <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">
            {trip.itinerary}
          </p>
        </div>
      ) : null}

      {trip.leaderContact ? (
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Leader contact
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {trip.leaderContact}
          </p>
        </div>
      ) : null}
    </section>
  )
}
