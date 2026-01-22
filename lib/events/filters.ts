import type { Filters } from '@/components/filters-panel'
import type { CalendarTrip } from '@/lib/events/types'

export function filterTrips(trips: CalendarTrip[], filters: Filters): CalendarTrip[] {
  return trips
    .filter((trip) => {
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        if (
          !trip.title.toLowerCase().includes(searchLower) &&
          !trip.state.toLowerCase().includes(searchLower)
        ) {
          return false
        }
      }

      if (filters.season !== 'All Seasons') {
        const seasonTag = filters.season.toLowerCase()
        if (!trip.tags.includes(seasonTag)) return false
      }

      if (filters.difficulty !== 'All Levels') {
        if (trip.difficulty !== filters.difficulty) return false
      }

      if (filters.activity !== 'All Activities') {
        const activityTag = filters.activity.toLowerCase()
        if (!trip.tags.includes(activityTag)) return false
      }

      if (filters.membersOnly && !trip.membersOnly) return false

      return true
    })
    .sort((a, b) => new Date(a.dateStart).getTime() - new Date(b.dateStart).getTime())
}
