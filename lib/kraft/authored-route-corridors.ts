import type { Boulder, RouteFactObservation } from './types'

const reviewedAt = '2026-10-01'
const faceId = 'pearl-southeast'
const sharedPath =
  'C395 720 406 650 400 620 C397 584 358 567 351 525 C350 470 356 415 370 385'

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
      'Reference-only photography identifies the main seam and its upper shoulder. Landmark correspondence with the BLM image was independently reviewed.',
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
 * Original broad corridors on the unchanged 1800×1350 BLM photo.
 * Independent corridor_geometry_critic accepted both corrected concepts on
 * 2026-10-01: pocket/crimp start, upper-left seam, projecting shoulder finish.
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
          ? `M424 969 C418 905 407 850 400 805 ${sharedPath}`
          : `M400 805 ${sharedPath}`,
        labelPoint: seated ? { x: 424, y: 969 } : { x: 400, y: 805 },
        corridorWidth: 90,
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
