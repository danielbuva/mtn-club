import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { TripCancellationNotice } from '@/components/trips/trip-cancellation-notice'
import { TripTitleText } from '@/components/trips/trip-title-text'
import { formatScheduleDate } from '@/lib/events/schedule'
import type { CalendarTrip } from '@/lib/events/types'

const gridClass =
  'mt-4 grid gap-px overflow-hidden border border-[#F8F1DF]/15 bg-[#F8F1DF]/15 sm:grid-cols-2'

export function TripScheduleList({ trips }: { trips: CalendarTrip[] }) {
  if (trips.length === 0) {
    return (
      <p className="mt-4 border border-[#F8F1DF]/15 p-5 text-sm text-[#F8F1DF]/75">
        No official trips are scheduled yet. Check back soon.
      </p>
    )
  }

  return (
    <div className={gridClass}>
      {trips.map(trip => (
        <Link
          key={trip.id}
          href={`/trips/${trip.id}`}
          className="group bg-[#211D18] p-5 outline-none transition hover:bg-[#2A241E] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#FFECA2]"
        >
          <p className="font-brand text-lg uppercase tracking-wide text-[#FFECA2]">
            <TripTitleText
              title={formatScheduleDate(trip.dateStart, trip.dateEnd)}
              canceled={trip.lifecycleStatus === 'canceled'}
            />
          </p>
          <h2 className="mt-1 flex items-start justify-between gap-3 text-lg font-semibold">
            <span>
              <TripTitleText
                title={trip.title}
                canceled={trip.lifecycleStatus === 'canceled'}
              />
            </span>
            <ArrowRight
              className="mt-1 size-4 shrink-0 transition-transform group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </h2>
          {trip.lifecycleStatus === 'canceled' && (
            <div className="mt-1">
              <TripCancellationNotice
                inverse
                reason={trip.cancellationReason}
              />
            </div>
          )}
          <p className="mt-2 text-sm leading-6 text-[#F8F1DF]/65">
            {trip.hosts.length
              ? `Led by ${trip.hosts.map(host => `${host.name} — ${host.title}`).join('; ')}`
              : 'Trip leaders will be announced.'}
          </p>
        </Link>
      ))}
    </div>
  )
}

export function TripScheduleSkeleton() {
  return (
    <output className={gridClass} aria-label="Loading official trips">
      {['first', 'second', 'third', 'fourth', 'fifth', 'sixth'].map(id => (
        <div key={id} className="bg-[#211D18] p-5" aria-hidden="true">
          <div className="flex h-7 items-center">
            <span className="h-4 w-36 animate-pulse bg-[#FFECA2]/15" />
          </div>
          <div className="mt-1 flex h-7 items-center">
            <span className="h-4 w-3/4 animate-pulse bg-[#F8F1DF]/15" />
          </div>
          <div className="mt-2 flex h-6 items-center">
            <span className="h-3 w-1/2 animate-pulse bg-[#F8F1DF]/10" />
          </div>
        </div>
      ))}
    </output>
  )
}

export function TripScheduleUnavailable() {
  return (
    <div className="mt-4 space-y-3 border border-[#F8F1DF]/15 p-5 text-sm text-[#F8F1DF]/75">
      <p>We couldn&apos;t load the trip schedule. Please try again.</p>
      <a
        href="/schedule"
        className="inline-flex min-h-10 items-center font-semibold text-[#FFECA2] underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4"
      >
        Reload schedule
      </a>
    </div>
  )
}
