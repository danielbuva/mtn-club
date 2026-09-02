import { addDays } from 'date-fns'
import {
  FALL_2026_TRIPS,
  getFallTripScheduleKey,
  type PublicHost,
  WEEKLY_MEETUPS,
} from '@/lib/club-content'
import { formatDateOnly, parseCalendarDate } from '@/lib/events/formatters'
import type { CalendarTrip } from '@/lib/events/types'

const logisticsNote = 'Exact time and logistics announced in Discord.'
const pendingHolidayReview = new Set(['2026-11-26'])

const activityTags: Record<
  (typeof FALL_2026_TRIPS)[number]['activity'],
  string[]
> = {
  bouldering: ['climbing', 'bouldering', 'fall'],
  camping: ['camping', 'fall'],
  hiking: ['hiking', 'fall'],
  sport_climbing: ['climbing', 'sport climbing', 'fall'],
}

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

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

const buildWeeklyMeetups = (): CalendarTrip[] =>
  WEEKLY_MEETUPS.flatMap(meetup => {
    const entries: CalendarTrip[] = []
    const end = parseCalendarDate(meetup.lastDate)
    let cursor = parseCalendarDate(meetup.firstDate)

    while (cursor <= end) {
      const date = formatDateOnly(cursor)
      if (pendingHolidayReview.has(date)) {
        cursor = addDays(cursor, 7)
        continue
      }
      entries.push({
        id: `fall-2026-weekly-${slugify(meetup.location)}-${date}`,
        title: `${meetup.day.slice(0, -1)} meetup`,
        state: meetup.location,
        coordinates: { lat: 0, lng: 0 },
        dateStart: date,
        dateEnd: date,
        difficulty: null,
        miles: null,
        elevationGain: null,
        tags: ['climbing', 'meetup', 'fall'],
        photos: [],
        membersOnly: false,
        description:
          'Weekly community meetup. General meeting dates and schedule changes are announced in Discord.',
        meetingTime: meetup.time,
        meetingLocation: meetup.location,
        isOfficial: true,
        isAllDay: false,
        hosts: [] as PublicHost[],
      })
      cursor = addDays(cursor, 7)
    }

    return entries
  })

export function getFall2026Calendar(): CalendarTrip[] {
  return [...buildWeeklyMeetups(), ...FALL_2026_TRIPS.map(buildTrip)].sort(
    (left, right) => left.dateStart.localeCompare(right.dateStart),
  )
}
