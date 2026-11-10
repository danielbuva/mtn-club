export { publicationDateline } from './dateline'

import type { StaticImageData } from 'next/image'
import type { TripActivityType } from '@/lib/trips/types'
import greatBasinFilm from '@/public/editions/great-basin-film-2025.jpg'

export type SpecialEdition = {
  level: 'special'
  label: string
  headline: string
  kicker: string
  photo: {
    src: StaticImageData
    alt: string
    position?: string
    overlayCorner?: 'top-left' | 'top-right'
    credit: string
  }
  tone: 'ink' | 'highlight'
  coverUntil?: string
}
export type TripEdition = SpecialEdition | { level: 'feature'; label: string }
export type EditionLevel = TripEdition['level']

const bishop: SpecialEdition = {
  level: 'special',
  label: 'Special Edition No. 01',
  headline: 'Granite & Campfires',
  kicker: 'Three days under the Eastern Sierra',
  photo: {
    src: greatBasinFilm,
    alt: 'Four club members with backpacks smiling in front of snowy granite peaks and pines, shot on film',
    position: '50% 60%',
    overlayCorner: 'top-right',
    credit: 'Photo: Skylar Houchen · Great Basin, 2025 · On film',
  },
  tone: 'highlight',
  coverUntil: '2026-12-01',
}

/** Legacy schedule keys resolve to the same persistent edition. */
export const specialEditions: Readonly<Record<string, SpecialEdition>> = {
  'fall-2026-camp-and-climb-in-bishop': bishop,
  'fall-2026-camp-climb-bishop': bishop,
}

/** Resolve a special first, then official trips crossing a local calendar day. */
export function getTripEdition(input: {
  id: string
  scheduleKey?: string | null
  isOfficial?: boolean
  activityType: TripActivityType
  startAt: Date
  endAt?: Date
  timeZone?: string
}): TripEdition | null {
  if (input.scheduleKey && Object.hasOwn(specialEditions, input.scheduleKey)) {
    return specialEditions[input.scheduleKey]
  }
  if (
    input.isOfficial === false ||
    !input.endAt ||
    input.endAt <= input.startAt
  ) {
    return null
  }
  const calendar = new Intl.DateTimeFormat('en-US', {
    timeZone: input.timeZone ?? 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  if (calendar.format(input.startAt) === calendar.format(input.endAt)) {
    return null
  }
  return {
    level: 'feature',
    label: expeditionLabel(input.startAt, input.endAt, input.timeZone),
  }
}

/** Compact naming for list surfaces; the numbered label belongs on the poster. */
export function shortEditionLabel(edition: TripEdition): string {
  return edition.level === 'special' ? 'Special edition' : edition.label
}

/** Count local calendar nights, including daylight-saving boundaries. */
export function nightsLabel(
  start: Date,
  end: Date,
  timeZone = 'America/Los_Angeles',
): string {
  const calendar = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  const nights = Math.max(
    0,
    Math.round(
      (Date.parse(calendar.format(end)) - Date.parse(calendar.format(start))) /
        86400000,
    ),
  )
  return `${nights} ${nights === 1 ? 'night' : 'nights'}`
}

/** Shared expedition mark for every trip surface. */
export function expeditionLabel(
  start: Date,
  end: Date,
  timeZone?: string,
): string {
  return `Expedition · ${nightsLabel(start, end, timeZone)}`
}

/** The expanded expedition dateline for a trip's reader header. */
export function expeditionDateline(
  start: Date,
  end: Date,
  timeZone = 'America/Los_Angeles',
): string {
  const date = new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
  return `Expedition · ${date.format(start)} – ${date.format(end)} · ${nightsLabel(start, end, timeZone)}`
}
