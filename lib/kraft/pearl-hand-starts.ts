import type { AnnotationReview } from './route-annotation-types'
import type { Boulder } from './types'

const image = { assetId: 'pearl-southeast-guide', width: 1448, height: 1086 }
const review: AnnotationReview = {
  reviewer: 'MTN Club source correspondence',
  reviewedAt: '2026-10-01',
  description:
    'The separately reviewed route entry establishes a broad start region. It does not identify individual reconstructed holds. No left/right positions are derived by splitting the route entry point.',
}

/** Preserve documented hand rules without inventing hand spacing on a new camera. */
export function applyPearlHandStarts(boulders: Boulder[]): void {
  const pearl = boulders.find(boulder => boulder.id === 'pearl')
  if (!pearl) return
  for (const climb of pearl.climbs) {
    const start = climb.routeAnnotations?.start
    const geometry = climb.geometry.find(
      item => item.status === 'authored' && item.faceId === 'pearl-southeast',
    )
    if (!start || geometry?.status !== 'authored') continue
    if (climb.id !== 'the-pearl' && climb.id !== 'pearl-pearl-necklace')
      continue
    geometry.annotations = {
      start: {
        ...start,
        placement: {
          status: 'reviewed-region',
          image,
          precision: 'region',
          method: 'source-landmark-correspondence',
          review: {
            ...review,
            description:
              climb.id === 'the-pearl'
                ? 'The source specifies left hand in a pocket and right hand on a lower crimp. The general standing entry is reviewed; individual hand-to-feature correspondence on this reconstructed camera awaits photographic confirmation. No offset left/right markers are drawn.'
                : 'Both hands are documented below the standing start. The lower route entry is reviewed, but individual low holds and their left/right ordering are not established. No fabricated pair is drawn. The current start is unmatched.',
          },
          region: { ...geometry.labelPoint },
        },
      },
    }
  }
}
