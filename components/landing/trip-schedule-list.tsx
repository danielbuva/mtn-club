import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { ExpeditionPoster } from '@/components/editorial/expedition-poster'
import { TripCancellationNotice } from '@/components/trips/trip-cancellation-notice'
import { getCalendarTripEdition } from '@/components/trips/trip-edition-mark'
import { TripTitleText } from '@/components/trips/trip-title-text'
import { formatScheduleDate } from '@/lib/events/schedule'
import type { CalendarTrip } from '@/lib/events/types'
import { cn } from '@/lib/utils'

const gridClass =
  'mt-4 grid gap-px overflow-hidden border border-[#F8F1DF]/15 bg-[#211D18] sm:grid-cols-2'

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
      {trips.map(trip => {
        const edition = getCalendarTripEdition(trip)
        return (
          <Link
            key={trip.id}
            href={`/trips/${trip.id}`}
            className={cn(
              'group bg-[#211D18] p-5 outline outline-1 -outline-offset-1 outline-[#F8F1DF]/15 motion-safe:transition hover:bg-[#2A241E] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#FFECA2]',
              edition?.level === 'special' && 'sm:col-span-2',
            )}
          >
            {edition?.level === 'special' ? (
              <div className="mb-4">
                <ExpeditionPoster
                  edition={edition}
                  title={trip.title}
                  place="Bishop, California"
                  dateLabel={formatScheduleDate(trip.dateStart, trip.dateEnd)}
                  status={
                    trip.lifecycleStatus === 'canceled' ? 'canceled' : undefined
                  }
                  size="card"
                  variant="list"
                />
              </div>
            ) : edition?.level === 'feature' ? (
              <p className="mb-3 font-brand text-[13px] uppercase tracking-wide text-[#FFECA2]">
                {edition.label}
              </p>
            ) : null}
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
                className="mt-1 size-4 shrink-0 motion-safe:transition-transform motion-safe:group-hover:translate-x-0.5"
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
        )
      })}
    </div>
  )
}

export function TripScheduleSkeleton({
  featured = false,
}: {
  featured?: boolean
}) {
  return (
    <output className={gridClass} aria-label="Loading official trips">
      {featured ? (
        <div
          className="bg-[#211D18] p-5 outline outline-1 -outline-offset-1 outline-[#F8F1DF]/15 sm:col-span-2"
          aria-hidden="true"
        >
          <div className="mb-4 border border-[#F8F1DF]/80 bg-[#FFECA2] p-3 md:p-4">
            <div className="md:grid md:min-h-80 md:grid-cols-[3fr_2fr]">
              <div className="aspect-video bg-[#211D18]/20 motion-safe:animate-pulse md:aspect-auto" />
              <div className="space-y-3 pt-5 md:flex md:flex-col md:justify-center md:py-6 md:pl-6">
                <div className="h-7 w-44 shrink-0 bg-[#211D18]/20" />
                <div className="space-y-1">
                  <div className="h-7 w-4/5 bg-[#211D18]/20 sm:h-9" />
                  <div className="h-7 w-3/5 bg-[#211D18]/20 sm:h-9" />
                </div>
                <div className="h-5 w-full shrink-0 bg-[#211D18]/20" />
              </div>
            </div>
          </div>
          <div className="h-7 w-40 motion-safe:animate-pulse bg-[#FFECA2]/15" />
          <div className="mt-1 h-7 w-3/4 motion-safe:animate-pulse bg-[#F8F1DF]/15" />
          <div className="mt-2 h-6 w-1/2 motion-safe:animate-pulse bg-[#F8F1DF]/10" />
        </div>
      ) : null}
      {['first', 'second', 'third', 'fourth', 'fifth', 'sixth'].map(id => (
        <div
          key={id}
          className="bg-[#211D18] p-5 outline outline-1 -outline-offset-1 outline-[#F8F1DF]/15"
          aria-hidden="true"
        >
          <div className="flex h-7 items-center">
            <span className="h-4 w-36 motion-safe:animate-pulse bg-[#FFECA2]/15" />
          </div>
          <div className="mt-1 flex h-7 items-center">
            <span className="h-4 w-3/4 motion-safe:animate-pulse bg-[#F8F1DF]/15" />
          </div>
          <div className="mt-2 flex h-6 items-center">
            <span className="h-3 w-1/2 motion-safe:animate-pulse bg-[#F8F1DF]/10" />
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
        className="inline-flex min-h-11 items-center font-semibold text-[#FFECA2] underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4"
      >
        Reload schedule
      </a>
    </div>
  )
}
