import { TripsList } from '@/components/trips/TripsList'
import { Card, CardContent } from '@/components/ui/card'
import { WeeklyMeetupNote } from '@/components/weekly-meetup-note'
import { fetchPublicHostsByTrip, fetchTripsInRange } from '@/lib/events/queries'
import type { EventRow } from '@/lib/events/types'
import {
  legacyRsvpChoice,
  registrationTripStatus,
} from '@/lib/registration/presentation'
import { getRegistrationSummaries } from '@/lib/registration/server'
import { createClient } from '@/lib/supabase/server'
import type {
  TripActivityType,
  TripDifficulty,
  TripListItem,
  TripRsvpChoice,
  TripStatus,
} from '@/lib/trips/types'

const resolveActivityType = (
  activityTags: string[] | null,
): TripActivityType => {
  const normalizedTags = (activityTags ?? []).map(tag => tag.toLowerCase())
  if (
    normalizedTags.some(tag => tag.includes('climb') || tag.includes('boulder'))
  ) {
    return 'climbing'
  }

  if (normalizedTags.some(tag => tag.includes('backpack'))) {
    return 'backpacking'
  }

  if (normalizedTags.some(tag => tag.includes('camp'))) {
    return 'camping'
  }

  if (normalizedTags.some(tag => tag.includes('hike'))) {
    return 'hiking'
  }

  return 'other'
}

const resolveDifficulty = (
  raw: EventRow['difficulty'] | null,
): TripDifficulty | undefined => {
  if (!raw) {
    return undefined
  }

  if (raw === 'beginner') {
    return 'beginner'
  }

  if (raw === 'intermediate') {
    return 'intermediate'
  }

  if (raw === 'hard') {
    return 'advanced'
  }

  return raw === 'expert' ? 'expert' : undefined
}

const toTripListItem = (
  event: EventRow,
  rsvpCount: number,
  currentUserRsvp: TripRsvpChoice,
  status: TripStatus,
  leaderName?: string,
): TripListItem => {
  const difficulty = resolveDifficulty(event.difficulty)
  const activityTags = event.activity_tags ?? []
  const activityType = resolveActivityType(activityTags)
  const tags = activityTags.filter(
    tag => tag.trim().toLowerCase() !== 'outdoor',
  )

  return {
    id: event.id,
    cancellationReason: event.cancellation_reason,
    lifecycleStatus: event.lifecycle_status,
    title: event.title,
    activityType,
    activityTags,
    heroImageUrl: event.cover_image_path ?? undefined,
    locationName: event.location_public ?? 'TBD',
    startAt: new Date(event.starts_at),
    endAt: event.ends_at ? new Date(event.ends_at) : undefined,
    isAllDay: event.is_all_day,
    isOfficial: event.is_official,
    difficulty,
    capacity: event.capacity ?? undefined,
    rsvpCount,
    status,
    visibility: event.visibility,
    waitlistEnabled: event.waitlist_enabled,
    currentUserRsvp,
    leaderName,
    tags: tags.length ? tags : undefined,
    detailHref: `/trips/${event.id}`,
  }
}

export default async function TripsPage() {
  const supabase = await createClient()
  const rangeStart = new Date('2026-09-01T00:00:00-07:00')
  const rangeEnd = new Date('2026-12-01T23:59:59.999-08:00')

  const events = await fetchTripsInRange(supabase, {
    start: rangeStart,
    end: rangeEnd,
  })

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

    acc.push(
      toTripListItem(
        event,
        rsvpCount,
        currentUserRsvp,
        event.lifecycle_status === 'canceled'
          ? 'cancelled'
          : registrationTripStatus(registration.availability),
        leaderName,
      ),
    )
    return acc
  }, [])

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
          Showing trips from Sep 1, 2026 to Dec 1, 2026.
        </p>
        <WeeklyMeetupNote className="text-foreground/80" />
      </section>

      {trips.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-sm text-muted-foreground">
              No upcoming trips are scheduled yet. Check back soon.
            </p>
          </CardContent>
        </Card>
      ) : (
        <TripsList trips={trips} />
      )}
    </main>
  )
}
