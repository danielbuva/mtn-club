import type { Boulder, RouteFactObservation } from './types'

const reviewedAt = '2026-10-01'
const faceId = 'pearl-southeast'
const sharedPath =
  'C520 690 450 650 420 605 C425 545 470 500 475 455 C455 390 395 340 380 285 C375 245 380 205 385 175'

const photographicFacts: RouteFactObservation[] = [
  {
    sourceId: 'mp-pearl-view-reference',
    publisher: 'Mountain Project',
    retrievedAt: reviewedAt,
    sourceDependency: 'primary-source-page',
    sectionAvailability: { description: 'present', location: 'absent' },
    facts: {
      face: [],
      start: [],
      path: [
        'The named Pearl photograph identifies the central ascending seam, left of the adjoining ramp climb.',
      ],
      finish: [],
      constraints: [],
      approach: [],
    },
    synopsis:
      'Reference-only photography identifies the main seam and its upper shoulder. The new near-frontal image correspondence is authored separately from the former BLM-photo coordinates.',
    unresolved: [
      'This supports a general corridor, not exact movement or present hold conditions.',
    ],
  },
  {
    sourceId: 'mp-pearl-finish-reference',
    publisher: 'Mountain Project',
    retrievedAt: reviewedAt,
    sourceDependency: 'primary-source-page',
    sectionAvailability: { description: 'present', location: 'absent' },
    facts: {
      face: [],
      start: [],
      path: [],
      finish: [
        'The route-linked topout photograph shows upper lip jugs. Comparison with the full-face reference places this finish on the projecting left shoulder.',
      ],
      constraints: [],
      approach: [],
    },
    synopsis:
      'The named Pearl finishing photograph supplies a general lip/topout reference; no reference pixels are included in the guide.',
    unresolved: [
      'The finishing region is approximate; exact holds are omitted.',
    ],
  },
]

/**
 * Original broad corridors on the 1448×1086 near-frontal Pearl guide image.
 * Photo-reference landmarks establish the pocket/crimp start, zigzagging
 * face region and projecting shoulder finish below the highest crest.
 * Pearl Necklace's lower region follows its documented seated link into Pearl;
 * neither path claims hold-level precision or field verification.
 */
export function applyAuthoredRouteCorridors(boulders: Boulder[]): void {
  const pearl = boulders.find(boulder => boulder.id === 'pearl')
  if (!pearl) throw new Error('Missing Pearl catalog for authored corridors')
  for (const id of ['the-pearl', 'pearl-pearl-necklace']) {
    const climb = pearl.climbs.find(item => item.id === id)
    if (!climb?.routeFacts || !climb.faceIds.includes(faceId))
      throw new Error(`Missing source-backed corridor route ${id}`)
    const seated = id === 'pearl-pearl-necklace'
    const facts = structuredClone(photographicFacts)
    climb.routeFacts.observations.push(...facts)
    climb.routeFacts.path = [
      ...climb.routeFacts.path,
      ...facts.flatMap(item => item.facts.path),
    ]
    climb.routeFacts.finish = [
      ...climb.routeFacts.finish,
      seated
        ? "Joins The Pearl's standing line and continues to its shoulder-lip topout."
        : facts.flatMap(item => item.facts.finish).join(' '),
    ]
    climb.sourceIds = [
      ...new Set([...climb.sourceIds, ...facts.map(item => item.sourceId)]),
    ]
    climb.geometry = [
      {
        status: 'authored',
        faceId,
        path: seated
          ? `M575 915 C568 880 558 845 555 820 C553 785 552 760 550 735 ${sharedPath}`
          : `M550 735 ${sharedPath}`,
        labelPoint: seated ? { x: 575, y: 915 } : { x: 550, y: 735 },
        corridorWidth: 130,
        sourceIds: [
          seated ? 'mp-route-107444907' : 'mp-pearl-route',
          ...facts.map(item => item.sourceId),
        ],
        reviewedAt,
        confidenceLevel: 'moderate',
      },
    ]
    climb.contentState = {
      status: 'partial',
      confidence: 'source-observation',
      reasons: [
        'A moderate, independently reviewed image-space corridor is available from documented start, general seam and finishing-lip evidence.',
        seated
          ? 'The lower seated entry is an approximate region; exact holds, current conditions and field verification are separate.'
          : 'The standing start and shoulder finish are approximate regions; exact holds, current conditions and field verification are separate.',
      ],
    }
  }
}
