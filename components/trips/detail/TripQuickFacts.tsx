import type { ReactNode } from 'react'
import { TripTitleText } from '@/components/trips/trip-title-text'
import {
  signupLine,
  spotsLine,
  tripDateLine,
  tripStatsLine,
  tripTimeLine,
} from '@/lib/trips/detail-format'
import { isTripPast } from '@/lib/trips/is-trip-past'
import type { TripDetail } from '@/lib/trips/types'

type TripQuickFactsProps = {
  trip: TripDetail
}

const viewerStatus: Partial<
  Record<NonNullable<TripDetail['registrationState']>, string>
> = {
  confirmed: 'You’re going',
  waitlisted: 'You’re on the waitlist',
  offered: 'A seat is yours to claim',
  incomplete: 'Your signup isn’t finished',
  legacy_review: 'Your signup is being reviewed',
  maybe: 'You said maybe',
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-3 px-4 py-3">
      <dt className="pt-0.5 font-brand text-[13px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </dt>
      <dd className="text-[15px] leading-6">{children}</dd>
    </div>
  )
}

export function TripQuickFacts({ trip }: TripQuickFactsProps) {
  const past = isTripPast(trip, Date.now())
  const time = tripTimeLine(trip)
  const spots = spotsLine(trip)
  const signups = signupLine(trip)
  const stats = tripStatsLine(trip)
  const status = trip.registrationState
    ? viewerStatus[trip.registrationState]
    : undefined
  const canceled = trip.status === 'cancelled'

  return (
    <section
      aria-label="Trip details"
      className="border-2 border-foreground bg-card dark:border-foreground/60"
    >
      {status && !canceled && !past ? (
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-b-2 border-foreground bg-[var(--editorial-highlight)] px-4 py-2.5 text-[#211d18] dark:border-foreground/60">
          <p className="font-brand text-base font-bold uppercase tracking-wide">
            {status}
          </p>
          {trip.registrationState === 'confirmed' && trip.locationNotes ? (
            <a
              href="#trip-logistics"
              className="text-sm underline underline-offset-4"
            >
              Meetup details
            </a>
          ) : null}
        </div>
      ) : null}
      <dl className="divide-y divide-border">
        <Fact label="When">
          <span className="block font-medium">
            <TripTitleText title={tripDateLine(trip)} canceled={canceled} />
          </span>
          {time || !past ? (
            <span className="block text-muted-foreground">
              {time ?? 'Time to be announced'}
            </span>
          ) : null}
        </Fact>
        <Fact label="Where">
          <span className="font-medium">{trip.locationName}</span>
        </Fact>
        {canceled ? null : (
          <Fact label={past ? 'Attendance' : 'Spots'}>
            <span className="block font-medium tabular-nums">
              {past ? `${trip.rsvpCount ?? 0} went` : spots.head}
            </span>
            {!past ? (
              <span className="block text-muted-foreground">
                {spots.detail}
              </span>
            ) : null}
            {trip.canViewAttendees && (trip.attendees?.length ?? 0) > 0 ? (
              <a
                href="#trip-attendees"
                className="mt-1 inline-block text-sm underline underline-offset-4 lg:hidden"
              >
                See {past ? 'who went' : 'who’s going'}
              </a>
            ) : null}
          </Fact>
        )}
        {signups && !past ? (
          <Fact label="Signups">
            <span className="block font-medium">{signups.label}</span>
            {signups.label === 'Closed' ? null : (
              <span className="block text-muted-foreground">
                {signups.value}
              </span>
            )}
          </Fact>
        ) : null}
        {stats ? (
          <Fact label="Trip">
            <span className="font-medium">{stats}</span>
          </Fact>
        ) : null}
      </dl>
    </section>
  )
}
