import type { CalendarTrip } from '@/lib/events/types'

export type CalendarCategoryKey =
  | 'hike'
  | 'climb'
  | 'snow'
  | 'camp'
  | 'run'
  | 'social'
  | 'other'

export const CATEGORY_LABELS: Record<CalendarCategoryKey, string> = {
  hike: 'Hike',
  climb: 'Climb',
  snow: 'Snow',
  camp: 'Camp',
  run: 'Run',
  social: 'Social',
  other: 'Other',
}

export const CATEGORY_COLORS: Record<CalendarCategoryKey, string> = {
  hike: 'bg-emerald-500',
  climb: 'bg-rose-500',
  snow: 'bg-sky-500',
  camp: 'bg-amber-500',
  run: 'bg-lime-500',
  social: 'bg-cyan-500',
  other: 'bg-slate-400',
}

const CATEGORY_BY_TAG: Record<string, CalendarCategoryKey> = {
  hike: 'hike',
  hiking: 'hike',
  climb: 'climb',
  climbing: 'climb',
  snow: 'snow',
  ski: 'snow',
  skiing: 'snow',
  snowboard: 'snow',
  camp: 'camp',
  camping: 'camp',
  run: 'run',
  running: 'run',
  social: 'social',
  volunteer: 'social',
  meetup: 'social',
}

export function getTagCategory(tag: string): CalendarCategoryKey {
  return CATEGORY_BY_TAG[tag.toLowerCase()] ?? 'other'
}

export function getTripCategories(trip: CalendarTrip): CalendarCategoryKey[] {
  const categories = new Set<CalendarCategoryKey>()
  for (const tag of trip.tags) {
    const normalized = tag.toLowerCase()
    const mapped = CATEGORY_BY_TAG[normalized]
    if (mapped) {
      categories.add(mapped)
    }
  }

  if (categories.size === 0) {
    categories.add('other')
  }

  return Array.from(categories)
}

export function getDayCategories(trips: CalendarTrip[]): CalendarCategoryKey[] {
  const categories = new Set<CalendarCategoryKey>()
  for (const trip of trips) {
    for (const category of getTripCategories(trip)) {
      categories.add(category)
    }
  }
  return Array.from(categories).slice(0, 3)
}
