import type { Boulder } from './types'

const viewIds = [
  'mp-view-106657477-main-south',
  'mp-view-106657477-main-southwest',
  'mp-view-106657477-fluffer-donkey-relative-region',
]
const sourceIds = [
  'mtn-club-warm-main-southwest-guide',
  'mp-warm-main-photo-107432433',
  'mp-warm-main-photo-107432437',
  'mp-warm-main-photo-107030500',
]
const qualification =
  'Original MTN Club reconstruction of the observed main south/southwest plane, shared as context for seven qualified main-plane source memberships. Relative bearing stays unknown and provisional. The full east plane, back and companion are outside this image scope. Exact holds, route placement, rendered guide review, human review and field conditions remain unverified.'

/** A context image does not upgrade source bearings or author route artwork. */
export function applyWarmMainImage(boulders: Boulder[]): void {
  const unit = boulders.find(item => item.sourceIdentity?.mpId === '106657477')
  if (!unit) throw new Error('Missing Warm-up Main source catalog')
  for (const id of viewIds) {
    const face = unit.faces.find(item => item.id === id)
    if (!face?.sourceViewObservations?.length)
      throw new Error(`Missing qualified Warm-up Main view ${id}`)
    face.image = {
      status: 'available',
      src: '/kraft/warm-main-southwest-guide.webp',
      width: 1448,
      height: 1086,
      alt: 'Original near-frontal reconstruction of Warm-up Main’s broad sandstone plane, showing its rounded crown, oblique lower break, rocky foot and narrow right passage.',
      assetId: 'warm-main-southwest-guide',
      representation: 'reconstruction',
    }
    face.sourceIds = [...new Set([...face.sourceIds, ...sourceIds])]
    face.photographNote = [
      ...face.sourceViewObservations.flatMap(observation => [
        observation.note,
        `${observation.sourceId}: ${observation.sourceFact}`,
        ...observation.relationEvidence.map(
          related => `${related.sourceId}: ${related.sourceFact}`,
        ),
      ]),
      qualification,
    ].join(' ')
    for (const climbId of face.climbIds) {
      const climb = unit.climbs.find(item => item.id === climbId)
      if (!climb) throw new Error(`Missing Warm-up Main route ${climbId}`)
      climb.contentState = {
        status: 'blocked-evidence',
        confidence: 'source-observation',
        reasons: [
          qualification,
          'The context reconstruction is available; source facts, provisional memberships and unlocated annotations do not establish image-space route geometry.',
        ],
      }
    }
  }
  unit.contentState = {
    status: 'blocked-evidence',
    confidence: 'source-observation',
    reasons: [
      'The Main Area Warm-up source catalog describes a pair of rocks; the main-plane image does not identify the full companion or every catalog route.',
      qualification,
    ],
  }
}
