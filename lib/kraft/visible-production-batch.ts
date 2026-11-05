import type { auditedGrants } from './audited-grants'
import type { RouteAnnotations } from './route-annotation-types'
import type {
  Boulder,
  EvidenceSource,
  Face,
  GuideAsset,
  RouteFactObservation,
} from './types'
import { visibleEastFaces } from './visible-east-records.ts'
import { visibleExistingCorridorFaces } from './visible-existing-corridors.ts'
import {
  type Corridor,
  type VisibleFace,
  visibleWestMainFaces,
} from './visible-west-main-records.ts'

const faces = [
  ...visibleWestMainFaces,
  ...visibleEastFaces,
  ...visibleExistingCorridorFaces,
]
const newImages = [...visibleWestMainFaces, ...visibleEastFaces]
const reviewedAt = '2026-10-01'
const imageSize = { width: 1448, height: 1086 }
const provenanceRoot =
  'https://github.com/danielbuva/mtn-club/blob/feat/kraft-offline-guidebook/public/kraft/'
const qualification =
  'Original MTN Club raster reconstruction with independently authored broad route corridors. Only source-observed macro landmarks and general entry/exit regions correspond to the image. Fine texture is illustrative, individual hand holds are not mapped, and current conditions and field verification remain unconfirmed.'

function provenanceUrl(assetId: string): string {
  return `${provenanceRoot}${assetId}-provenance.json`
}

export const visibleProductionGrants = newImages.map<
  (typeof auditedGrants)[number]
>(face => ({
  sourceId: `mtn-club-${face.assetId}`,
  sourceUrl: provenanceUrl(face.assetId),
  evidenceUrl: provenanceUrl(face.assetId),
  usage: 'licensed-media',
  licenseIds: ['MTN-Club-original'],
  record: `public/kraft/${face.assetId}-provenance.json`,
}))

export const visibleProductionSources = newImages.flatMap<EvidenceSource>(
  face => [
    {
      id: `mtn-club-${face.assetId}`,
      title: `MTN Club original ${face.name} reconstruction`,
      url: provenanceUrl(face.assetId),
      publisher: 'MTN Club',
      accessedAt: reviewedAt,
      usage: 'licensed-media',
      license: 'Original MTN Club guide asset',
      distribution: {
        licenseIds: ['MTN-Club-original'],
        evidenceUrl: provenanceUrl(face.assetId),
      },
      note: qualification,
    },
    ...face.photoIds.map(id => ({
      id: `mp-visible-photo-${id}`,
      title: `${face.name} factual photo reference ${id}`,
      url: `https://www.mountainproject.com/photo/${id}`,
      publisher: 'Mountain Project',
      accessedAt: reviewedAt,
      usage: 'factual-reference' as const,
      note: 'Reference-only macro landmarks and named route-region context; no source pixels or topo artwork are reproduced or distributed.',
    })),
  ],
)

const referenceIds = new Set(visibleProductionSources.map(source => source.id))
for (const face of visibleExistingCorridorFaces)
  for (const id of face.photoIds) {
    const sourceId = `mp-visible-photo-${id}`
    if (referenceIds.has(sourceId)) continue
    visibleProductionSources.push({
      id: sourceId,
      title: `Factual face reference ${id}`,
      url: `https://www.mountainproject.com/photo/${id}`,
      publisher: 'Mountain Project',
      accessedAt: reviewedAt,
      usage: 'factual-reference',
      note: 'Reference-only macro region correspondence; source pixels and topo artwork are not distributed.',
    })
    referenceIds.add(sourceId)
  }

export const visibleProductionAssets = newImages.map<GuideAsset>(face => ({
  id: face.assetId,
  src: `/kraft/${face.assetId}.webp`,
  kind: 'face-photo',
  license: 'Original MTN Club guide asset',
  distribution: {
    licenseIds: ['MTN-Club-original'],
    evidenceUrl: provenanceUrl(face.assetId),
  },
  attribution:
    'Original MTN Club raster reconstruction, generated from text-only factual synthesis.',
  attributionUrl: provenanceUrl(face.assetId),
  modificationNote: qualification,
  sourceIds: [`mtn-club-${face.assetId}`],
}))

function referenceFacts(
  spec: VisibleFace,
  corridor: Corridor,
): RouteFactObservation | undefined {
  const evidence = corridor.finishEvidence
  if (!evidence) return undefined
  if (!spec.photoIds.includes(evidence.photoId))
    throw new Error(`Uninspected finishing reference ${evidence.photoId}`)
  return {
    sourceId: `mp-visible-photo-${evidence.photoId}`,
    publisher: 'Mountain Project',
    retrievedAt: reviewedAt,
    sourceDependency: 'primary-source-page',
    sectionAvailability: { description: 'present', location: 'absent' },
    facts: {
      face: [],
      start: evidence.startFact ? [evidence.startFact] : [],
      path: [],
      finish: [evidence.fact],
      constraints: [],
      approach: [],
    },
    synopsis:
      'Directly named source-photo terminal-region observation only. Authored raster/SVG correspondence remains separate from these source facts.',
    unresolved: [
      'Exact hand holds, calibrated camera bearing and current rock conditions are unverified.',
    ],
  }
}

/** Original view/corridor authoring keeps existing source face observations intact. */
export function applyVisibleProductionBatch(boulders: Boulder[]): void {
  for (const spec of faces) {
    const unit = boulders.find(
      item => item.sourceIdentity?.mpId === spec.mpParentId,
    )
    if (!unit)
      throw new Error(`Missing visible batch parent ${spec.mpParentId}`)
    let face = unit.faces.find(item => item.id === spec.faceId)
    if (!face) {
      face = {
        id: spec.faceId,
        name: spec.name,
        orientation: spec.orientation,
        orientationStatus:
          spec.orientation === 'unknown' ? 'unknown' : 'source-observation',
        groupingStatus: 'source-backed',
        image: { status: 'missing', reason: 'Original image pending binding.' },
        climbIds: [],
        sourceIds: [],
      } satisfies Face
      unit.faces.unshift(face)
    }
    face.image = {
      status: 'available',
      src: `/kraft/${spec.assetId}.webp`,
      ...imageSize,
      alt: spec.alt,
      assetId: spec.assetId,
      representation: 'reconstruction',
    }
    face.sourceIds = [
      ...new Set([
        ...face.sourceIds,
        `mtn-club-${spec.assetId}`,
        ...spec.photoIds.map(id => `mp-visible-photo-${id}`),
      ]),
    ]
    face.photographNote = qualification
    for (const corridor of spec.corridors) {
      const climb = unit.climbs.find(
        item => item.sourceIdentity?.mpId === corridor.mpRouteId,
      )
      const primary = climb?.routeFacts?.observations.find(
        item =>
          item.publisher === 'Mountain Project' &&
          item.sourceDependency === 'primary-source-page',
      )
      if (
        !climb?.routeFacts ||
        !primary ||
        climb.boulderAssignmentStatus !== 'source-backed'
      )
        throw new Error(
          `Missing exact source-backed corridor ${corridor.mpRouteId}`,
        )
      const rule = primary.facts.start.join(' ')
      const posture = /\b(?:seated|sit)\b/i.test(rule)
        ? 'sit'
        : /\b(?:standing|stand)\b/i.test(rule)
          ? 'stand'
          : undefined
      const review = {
        reviewer: 'MTN Club corridor author (agent)',
        reviewedAt,
        description:
          'General entry region corresponds to source posture/feature and photographed macro landmarks; no generated microtexture or individual hold coordinates are used.',
      }
      const annotations: RouteAnnotations | undefined = rule
        ? {
            start: {
              kind: 'start-zone',
              ...(posture ? { posture } : {}),
              rule,
              sourceIds: [primary.sourceId],
              review,
              placement: {
                status: 'reviewed-region',
                image: { assetId: spec.assetId, ...imageSize },
                precision: 'region',
                method: 'source-landmark-correspondence',
                review,
                region: corridor.entry,
              },
            },
          }
        : undefined
      const facts = referenceFacts(spec, corridor)
      if (facts) {
        climb.routeFacts.observations.push(facts)
        for (const key of ['start', 'finish'] as const)
          climb.routeFacts[key] = [
            ...new Set([...climb.routeFacts[key], ...facts.facts[key]]),
          ]
      }
      climb.sourceIds = [
        ...new Set([...climb.sourceIds, primary.sourceId, ...face.sourceIds]),
      ]
      climb.faceIds = [...new Set([face.id, ...climb.faceIds])]
      climb.faceAssignmentStatus = 'source-backed'
      face.climbIds = [...new Set([...face.climbIds, climb.id])]
      face.sourceIds = [...new Set([...face.sourceIds, primary.sourceId])]
      const hasBoundary =
        climb.routeFacts.start.length > 0 && climb.routeFacts.finish.length > 0
      if (!hasBoundary) {
        climb.geometry = [
          ...climb.geometry.filter(item => item.faceId !== face.id),
          {
            status: 'missing',
            faceId: face.id,
            reason:
              'A source finishing region is not documented or identified by a named photo reference. Face membership is retained; a line to the boulder crest is not inferred.',
          },
        ]
        climb.contentState = {
          status: 'blocked-evidence',
          confidence: 'source-observation',
          reasons: [
            qualification,
            'The pictured face is available; source finish evidence is insufficient for a corridor.',
          ],
        }
        continue
      }
      climb.geometry = [
        ...climb.geometry.filter(item => item.faceId !== face.id),
        {
          status: 'authored',
          faceId: face.id,
          path: corridor.path,
          labelPoint: corridor.entry,
          corridorWidth: 120,
          sourceIds: [
            ...new Set([
              primary.sourceId,
              ...spec.photoIds.map(id => `mp-visible-photo-${id}`),
            ]),
          ],
          reviewedAt,
          confidenceLevel: 'moderate',
          annotations,
        },
      ]
      climb.contentState = {
        status: 'partial',
        confidence: 'source-observation',
        reasons: [
          qualification,
          `Authored image correspondence: ${corridor.region} Finishing-region correspondence: ${corridor.finish}`,
          'A general corridor is available; exact movement, individual hands and field verification are separate.',
        ],
      }
    }
    unit.sourceIds = [...new Set([...unit.sourceIds, ...face.sourceIds])]
    unit.contentState = {
      status: 'partial',
      confidence: 'source-observation',
      reasons: [
        qualification,
        'Only the pictured source-qualified routes are drawn; other catalog routes remain available separately.',
      ],
    }
  }
}
