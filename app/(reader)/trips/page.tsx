import Link from 'next/link'
import { Suspense } from 'react'
import { TripsList } from '@/components/trips/TripsList'
import { TripsListLoading } from '@/components/trips/trips-list-loading'
import { Card, CardContent } from '@/components/ui/card'
import { WeeklyMeetupNote } from '@/components/weekly-meetup-note'
import { fetchPublicHostsByTrip } from '@/lib/events/queries'
import {
  legacyRsvpChoice,
  registrationTripStatus,
} from '@/lib/registration/presentation'
import { getRegistrationSummaries } from '@/lib/registration/server'
import { createClient } from '@/lib/supabase/server'
import { toTripListItem } from '@/lib/trips/list-item'
import { fetchTripListPage, parseTripListParams } from '@/lib/trips/list-query'
import type { TripListItem } from '@/lib/trips/types'

type TripsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

async function TripResults({ searchParams }: TripsPageProps) {
  const supabase = await createClient()
  const { view, page } = parseTripListParams(await searchParams)
  const { events, hasMore } = await fetchTripListPage(supabase, view, page)

  const tripIds = events.map(event => event.id)
  const [registrations, hostsByTrip] = await Promise.all([
    getRegistrationSummaries(tripIds),
    fetchPublicHostsByTrip(supabase, tripIds),
  ])
  const registrationByTrip = new Map(
    registrations.map(row => [row.tripId, row]),
  )

  const trips = events.reduce<TripListItem[]>((acc, event) => {
    const registration = registrationByTrip.get(event.id)
    if (!registration)
      throw new Error('Trip registration counts are unavailable.')
    const rsvpCount = registration.confirmedCount
    const currentUserRsvp = legacyRsvpChoice(registration.state)
    const leaderName = hostsByTrip
      .get(event.id)
      ?.map(host => host.name)
      .join(', ')

    acc.push({
      ...toTripListItem(
        event,
        rsvpCount,
        currentUserRsvp,
        event.lifecycle_status === 'canceled'
          ? 'cancelled'
          : registrationTripStatus(registration.availability),
        leaderName,
      ),
      registrationState: registration.state,
      registrationReadOnly: new Date(event.starts_at).getTime() <= Date.now(),
      registrationActionRequired: registration.requirements.length > 0,
    })
    return acc
  }, [])

  return (
    <div className="space-y-6">
      <nav aria-label="Trip dates" className="flex gap-4">
        {(['upcoming', 'past'] as const).map(option => (
          <Link
            key={option}
            href={`/trips?view=${option}`}
            aria-current={view === option ? 'page' : undefined}
            className="rounded-sm text-sm font-semibold underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-ring"
          >
            {option === 'past' ? 'Past trips' : 'Upcoming trips'}
          </Link>
        ))}
      </nav>
      {trips.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-sm text-muted-foreground">
              {view === 'past'
                ? 'No past trips on this page.'
                : 'No upcoming trips on this page. Check back soon.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <TripsList trips={trips} />
      )}
      <nav aria-label="Trip pages" className="flex items-center gap-4 text-sm">
        {page > 1 ? (
          <Link
            className="rounded-sm underline focus-visible:ring-2 focus-visible:ring-ring"
            href={`/trips?view=${view}&page=${page - 1}`}
          >
            Previous
          </Link>
        ) : null}
        <span>Page {page}</span>
        {hasMore ? (
          <Link
            className="rounded-sm underline focus-visible:ring-2 focus-visible:ring-ring"
            href={`/trips?view=${view}&page=${page + 1}`}
          >
            Next
          </Link>
        ) : null}
      </nav>
    </div>
  )
}

export default function TripsPage(props: TripsPageProps) {
  return (
    <main className="public-page-top mx-auto w-full max-w-7xl px-4 pb-16 md:pb-20">
      <section className="mb-8 space-y-2">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          UNLV Mountain Club
        </p>
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
          Trips & Events
        </h1>
        <p className="text-sm text-muted-foreground">
          Browse official club trips and community events.
        </p>
        <WeeklyMeetupNote className="text-foreground/80" />
      </section>

      <Suspense fallback={<TripsListLoading />}>
        <TripResults {...props} />
      </Suspense>
    </main>
  )
}
