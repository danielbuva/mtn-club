import { FALL_2026_TRIPS, getFallTripScheduleKey } from '@/lib/club-content'
import type { CalendarTrip } from '@/lib/events/types'

const logisticsNote = 'Exact time and logistics announced in Discord.'

const activityTags: Record<
  (typeof FALL_2026_TRIPS)[number]['activity'],
  string[]
> = {
  bouldering: ['climbing', 'bouldering', 'fall'],
  camping: ['camping', 'fall'],
  hiking: ['hiking', 'fall'],
  sport_climbing: ['climbing', 'sport climbing', 'fall'],
}

const buildTrip = (trip: (typeof FALL_2026_TRIPS)[number]): CalendarTrip => ({
  id: getFallTripScheduleKey(trip),
  title: trip.title,
  state: 'Exact location in Discord',
  coordinates: { lat: 0, lng: 0 },
  dateStart: trip.startDate,
  dateEnd: trip.endDate ?? trip.startDate,
  difficulty: null,
  miles: null,
  elevationGain: null,
  tags: activityTags[trip.activity],
  photos: [],
  membersOnly: false,
  description: logisticsNote,
  meetingTime: null,
  meetingLocation: 'Exact location in Discord',
  isOfficial: true,
  isAllDay: true,
  hosts: trip.hosts,
})

export function getFall2026Calendar(): CalendarTrip[] {
  return FALL_2026_TRIPS.map(buildTrip).sort((left, right) =>
    left.dateStart.localeCompare(right.dateStart),
  )
}
