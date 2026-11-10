import { cacheLife } from 'next/cache'
import { type SpecialEdition, specialEditions } from './editions'

export type SpecialCover = {
  edition: Pick<SpecialEdition, 'label' | 'headline'>
  subline: string
  href: string
}

/** Pure registry selection, also used by editorial fixtures. */
export function activeCoverEditions(now: Date): SpecialCover[] {
  const unique = new Map(
    Object.values(specialEditions).map(edition => [edition.label, edition]),
  )
  return [...unique.values()]
    .filter(edition => edition.coverUntil && now < new Date(edition.coverUntil))
    .map(edition => ({
      edition: { label: edition.label, headline: edition.headline },
      subline: 'Camp and Climb in Bishop · Nov 27–29',
      href: '/trips/fall-2026-camp-and-climb-in-bishop',
    }))
}

/** Server-cached event selection; home photos stay in their original rotation. */
export async function getCoverEditionsCached() {
  'use cache'
  cacheLife('hours')
  const now = new Date()
  return {
    editions: activeCoverEditions(now),
  }
}
