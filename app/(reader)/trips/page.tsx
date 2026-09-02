import { addMonths, format, startOfDay } from 'date-fns'
import { TripsList } from '@/components/trips/TripsList'
import { Card, CardContent } from '@/components/ui/card'
import { WEEKLY_MEETUP_NOTE } from '@/lib/club-content'
import { fetchPublicHostsByTrip, fetchTripsInRange } from '@/lib/events/queries'
import type { EventRow } from '@/lib/events/types'
import { createClient } from '@/lib/supabase/server'
import type {
  TripActivityType,
  TripDifficulty,
  TripListItem,
  TripRsvpChoice,
  TripStatus,
} from '@/lib/trips/types'

type TripRsvpCountMap = Map<string, number>
type CurrentUserRsvpMap = Map<string, TripRsvpChoice>

const fetchRsvpCounts = async (
  tripIds: string[],
): Promise<TripRsvpCountMap> => {
  if (!tripIds.length) {
    return new Map()
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('trip_rsvps')
    .select('trip_id,status')
    .in('trip_id', tripIds)
    .eq('status', 'going')

  if (error || !data) {
    return new Map()
  }

  const counts = new Map<string, number>()
  for (const row of data) {
    counts.set(row.trip_id, (counts.get(row.trip_id) ?? 0) + 1)
  }
  return counts
}

const fetchCurrentUserRsvp = async (
  tripIds: string[],
): Promise<CurrentUserRsvpMap> => {
  if (!tripIds.length) {
    return new Map()
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return new Map()
  }

  const { data, error } = await supabase
    .from('trip_rsvps')
    .select('trip_id,status')
    .eq('user_id', user.id)
    .in('trip_id', tripIds)

  if (error || !data) {
    return new Map()
  }

  return new Map(
    data.map(row => {
      const normalizedStatus: TripRsvpChoice =
        row.status === 'removed'
          ? null
          : row.status === 'going'
            ? 'going'
            : row.status === 'waitlisted'
              ? 'waitlisted'
              : row.status === 'not_going'
                ? 'not_going'
                : null

      return [row.trip_id, normalizedStatus]
    }),
  )
}

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

const resolveStatus = (event: EventRow, rsvpCount: number): TripStatus => {
  if (event.visibility !== 'public') {
    return 'members_only'
  }

  if (typeof event.capacity === 'number' && rsvpCount >= event.capacity) {
    return event.waitlist_enabled ? 'waitlist' : 'full'
  }

  return 'open'
}

const toTripListItem = (
  event: EventRow,
  rsvpCount: number,
  currentUserRsvp: TripRsvpChoice,
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
    title: event.title,
    activityType,
    activityTags,
    heroImageUrl: event.cover_image_path ?? undefined,
    locationName: event.location_public ?? 'TBD',
    startAt: new Date(event.starts_at),
    endAt: event.ends_at ? new Date(event.ends_at) : undefined,
    isAllDay: event.is_all_day,
    difficulty,
    capacity: event.capacity ?? undefined,
    rsvpCount,
    status: resolveStatus(event, rsvpCount),
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
  const now = startOfDay(new Date())
  const sixMonthsOut = addMonths(now, 6)

  const events = await fetchTripsInRange(supabase, {
    start: now,
    end: sixMonthsOut,
  })

  const tripIds = events.map(event => event.id)
  const [rsvpCounts, currentUserRsvpByTrip, hostsByTrip] = await Promise.all([
    fetchRsvpCounts(tripIds),
    fetchCurrentUserRsvp(tripIds),
    fetchPublicHostsByTrip(supabase, tripIds),
  ])

  const trips = events.reduce<TripListItem[]>((acc, event) => {
    const rsvpCount = rsvpCounts.get(event.id) ?? 0
    const currentUserRsvp = currentUserRsvpByTrip.get(event.id) ?? null
    const leaderName = hostsByTrip
      .get(event.id)
      ?.map(host => host.name)
      .join(', ')

    acc.push(toTripListItem(event, rsvpCount, currentUserRsvp, leaderName))
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
          Showing trips from {format(now, 'MMM d, yyyy')} to{' '}
          {format(sixMonthsOut, 'MMM d, yyyy')}.
        </p>
        <p className="text-sm font-medium text-foreground/80">
          {WEEKLY_MEETUP_NOTE}
        </p>
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
