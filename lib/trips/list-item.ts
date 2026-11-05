import type { EventRow } from '@/lib/events/types'
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

export const toTripListItem = (
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
