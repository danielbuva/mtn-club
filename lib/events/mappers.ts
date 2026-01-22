import { getSeasonTag, formatDateOnly, formatTime } from '@/lib/events/formatters'
import type { CalendarTrip, EventRow, EventDifficulty } from '@/lib/events/types'

const DEFAULT_DIFFICULTY: EventDifficulty = 'Moderate'

const difficultyMap: Record<string, EventDifficulty> = {
  Easy: 'Easy',
  Moderate: 'Moderate',
  Challenging: 'Challenging',
  Expert: 'Expert',
}

export function eventToCalendarTrip(event: EventRow): CalendarTrip {
  const startAt = event.start_at
  const endAt = event.end_at ?? event.start_at
  const startDate = new Date(startAt)
  const endDate = new Date(endAt)

  const activityTags = (event.activity_types ?? []).map((tag) => tag.toLowerCase())
  const seasonTag = getSeasonTag(startDate)
  const tags = Array.from(new Set([...activityTags, seasonTag]))

  const difficulty = event.difficulty && difficultyMap[event.difficulty]
    ? difficultyMap[event.difficulty]
    : DEFAULT_DIFFICULTY

  const primaryLat = event.primary_location_lat ?? event.lat ?? 0
  const primaryLng = event.primary_location_lng ?? event.lon ?? 0

  return {
    id: event.id,
    title: event.title,
    state: event.primary_location_name ?? event.meeting_location_name ?? 'TBD',
    coordinates: {
      lat: primaryLat,
      lng: primaryLng,
    },
    dateStart: formatDateOnly(startDate),
    dateEnd: formatDateOnly(endDate),
    difficulty,
    miles: null,
    elevationGain: null,
    tags,
    photos: [],
    membersOnly: event.visibility !== 'public',
    description: event.short_summary ?? event.description ?? 'Details coming soon.',
    meetingTime: formatTime(event.meetup_time ?? event.start_at),
    meetingLocation: event.meeting_location_name ?? event.primary_location_name ?? 'TBD',
    isOfficial: event.is_official,
  }
}
