import { CalendarDays, Clock3, MapPin } from 'lucide-react'
import { TripTitleText } from '@/components/trips/trip-title-text'
import { formatTripDate, formatTripTime } from '@/lib/trips/format'
import type { TripDetail } from '@/lib/trips/types'

type TripQuickFactsProps = {
  trip: TripDetail
}

export function TripQuickFacts({ trip }: TripQuickFactsProps) {
  return (
    <section className="grid grid-cols-2 gap-3 rounded-2xl border border-border/70 bg-card p-4 md:grid-cols-3 md:p-5">
      <div className="space-y-1">
        <p className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
          Location
        </p>
        <p className="text-sm font-medium">{trip.locationName}</p>
      </div>
      <div className="space-y-1">
        <p className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
          <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
          Date
        </p>
        <p className="text-sm font-medium">
          <TripTitleText
            title={formatTripDate(trip.startAt, trip.endAt, trip.timeZone)}
            canceled={trip.status === 'cancelled'}
          />
        </p>
      </div>
      <div className="space-y-1">
        <p className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
          <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
          Time
        </p>
        <p className="text-sm font-medium">
          {trip.isAllDay
            ? 'TBA'
            : formatTripTime(trip.startAt, trip.endAt, trip.timeZone)}
        </p>
      </div>
    </section>
  )
}
