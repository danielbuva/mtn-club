import { publicationDateline } from '../editorial/dateline.ts'
import type { PublicGalleryPhoto } from './queries'

export type GalleryFrame = PublicGalleryPhoto & { frameNumber: string }

export type GalleryRoll = {
  id: string
  label: string
  number: string
  photos: GalleryFrame[]
}

/** Newest seasons first; unknown dates last. Never reorder within a season. */
export function groupIntoRolls(
  photos: readonly PublicGalleryPhoto[],
): GalleryRoll[] {
  const groups = new Map<
    string,
    { label: string; timestamp: number; photos: PublicGalleryPhoto[] }
  >()

  for (const photo of photos) {
    const date = photo.taken_on ? new Date(photo.taken_on) : null
    const dated = date !== null && Number.isFinite(date.getTime())
    const label = dated ? publicationDateline(date) : 'Undated'
    const id = label.toLowerCase().replace(' ', '-')
    const group = groups.get(id)
    if (group) {
      group.photos.push(photo)
    } else {
      groups.set(id, {
        label,
        timestamp: dated ? date.getTime() : Number.NEGATIVE_INFINITY,
        photos: [photo],
      })
    }
  }

  const ordered = [...groups.entries()].sort(
    ([, left], [, right]) => right.timestamp - left.timestamp,
  )
  return ordered.map(([id, group], index) => ({
    id,
    label: group.label,
    // Undated is the first archival roll; dated rolls count up chronologically.
    number: String(ordered.length - index).padStart(2, '0'),
    photos: group.photos.map((photo, frameIndex) => ({
      ...photo,
      frameNumber: String(frameIndex + 1).padStart(2, '0'),
    })),
  }))
}
