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
  const dateStart = formatDateOnly(startDate, event.time_zone)
  const dateEnd = formatDateOnly(endDate, event.time_zone)

  const activityTags = event.activity_tags ?? []
  const seasonTag = getSeasonTag(new Date(`${dateStart}T12:00:00`))
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
    dateStart,
    dateEnd,
    difficulty,
    miles: null,
    elevationGain: null,
    tags,
    photos: [],
    membersOnly: event.visibility !== 'public',
    description: event.description_public ?? 'Details coming soon.',
    meetingTime: event.is_all_day
      ? null
      : formatTimeRange(startAt, endAt, event.time_zone),
    meetingLocation: event.location_public ?? 'TBD',
    isOfficial: event.is_official,
    isAllDay: event.is_all_day,
    hosts: [],
  }
}
