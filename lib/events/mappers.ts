import {
  formatDateOnly,
  formatTimeRange,
  getSeasonTag,
} from '@/lib/events/formatters'
import type {
  CalendarTrip,
  EventDifficulty,
  EventRow,
} from '@/lib/events/types'

const difficultyMap: Record<string, EventDifficulty> = {
  beginner: 'Easy',
  intermediate: 'Moderate',
  hard: 'Challenging',
  expert: 'Expert',
}

export function eventToCalendarTrip(event: EventRow): CalendarTrip {
  const startAt = event.starts_at
  const endAt = event.ends_at ?? event.starts_at
  const startDate = new Date(startAt)
  const endDate = new Date(endAt)

  const activityTags: string[] = []
  const seasonTag = getSeasonTag(startDate)
  const tags = Array.from(new Set([...activityTags, seasonTag]))

  const difficulty = event.difficulty
    ? (difficultyMap[event.difficulty] ?? null)
    : null

  const primaryLat = 0
  const primaryLng = 0

  return {
    id: event.id,
    title: event.title,
    state: event.location_public ?? 'TBD',
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
    description: event.description_public ?? 'Details coming soon.',
    meetingTime: event.is_all_day ? null : formatTimeRange(startAt, endAt),
    meetingLocation: event.location_public ?? 'TBD',
    isOfficial: event.is_official,
    isAllDay: event.is_all_day,
    hosts: [],
  }
}
