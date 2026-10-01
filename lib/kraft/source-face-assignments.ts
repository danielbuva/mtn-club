import { sourceFaceRules } from './source-face-rules.ts'
import type {
  SourceFaceLedgerRow,
  SourceFaceObservation,
  SourceFaceOrientation,
  SourceFaceRule,
} from './source-face-types'
import type { Boulder, Climb, Face } from './types'

const orientations: SourceFaceOrientation[] = [
  'north',
  'northeast',
  'east',
  'southeast',
  'south',
  'southwest',
  'west',
  'northwest',
]
const pilotUnits = new Set(['cube', 'split-boulder', 'pearl', 'monkey-bar'])
const groupedParents = new Set([
  '125752769',
  '106657477',
  '123856651',
  '123856648',
])

/** A phrase check confirms a controlled rule; it never discovers new routes. */
export function explicitFaceOrientation(
  fact: string,
): SourceFaceOrientation | null {
  if (
    /\b(?:adjacent|detached|shelter|historically|neighboring|neighbouring|separate)\b/i.test(
      fact,
    ) ||
    /\b(?:another|other)\s+(?:rock|boulder|face)\b/i.test(fact)
  )
    return null
  const matches = [
    ...fact.matchAll(
      /\b(northeast|northwest|southeast|southwest|north|south|east|west)(?:[-/ ](?:facing|back|uphill|downhill))*[-/ ]+(?:face|side|wall|slab|overhang)\b/gi,
    ),
  ]
  if (
    matches.some(match =>
      /^(?:(?:located|starts?)\s+)?(?:(?:right|left|above|below|beside)\s+(?:of|from)|(?:at\s+the\s+)?base\s+of)\s+(?:the\s+)?$/i.test(
        fact.slice(0, match.index),
      ),
    )
  )
    return null
  const directions = matches.map(match => match[1]?.toLowerCase())
  const unique = [...new Set(directions)]
  if (unique.length !== 1) return null
  return orientations.find(orientation => orientation === unique[0]) ?? null
}

export function matchSourceFaceRule(
  unit: Boulder,
  climb: Climb,
  rule: SourceFaceRule,
): SourceFaceObservation | null {
  if (
    !sourceFaceRules.some(
      candidate =>
        candidate.mpRouteId === rule.mpRouteId &&
        candidate.mpParentId === rule.mpParentId &&
        candidate.orientation === rule.orientation,
    ) ||
    pilotUnits.has(unit.id) ||
    groupedParents.has(rule.mpParentId) ||
    unit.sourceIdentity?.mpId !== rule.mpParentId ||
    climb.sourceIdentity?.mpId !== rule.mpRouteId ||
    climb.boulderAssignmentStatus !== 'source-backed'
  )
    return null
  const parents = climb.parentObservations ?? []
  if (
    !parents.length ||
    parents.some(
      parent =>
        parent.identityStatus === 'source-linked' &&
        parent.parentUnitId !== unit.id,
    )
  )
    return null
  const source = climb.routeFacts?.observations.find(
    observation =>
      observation.publisher === 'Mountain Project' &&
      observation.sourceDependency === 'primary-source-page' &&
      climb.sourceIds.includes(observation.sourceId),
  )
  const sourceFact = source?.facts.face.find(
    fact => explicitFaceOrientation(fact) === rule.orientation,
  )
  if (!source || !sourceFact) return null
  return {
    ...rule,
    sourceId: source.sourceId,
    retrievedAt: source.retrievedAt,
    sourceFact,
    scope: 'source-catalog-face',
    note: 'Explicit source description of this route on its exact parent catalog. Cardinal aspects are source-observed groups, without a surveyed face boundary, shared camera view or field verification.',
  }
}

/** Apply only the controlled exact-ID batch, leaving all pilot faces intact. */
export function applySourceFaceAssignments(boulders: Boulder[]): void {
  const ruleIds = new Set<string>()
  for (const rule of sourceFaceRules) {
    if (ruleIds.has(rule.mpRouteId))
      throw new Error(
        `Duplicate controlled source-face route ${rule.mpRouteId}`,
      )
    ruleIds.add(rule.mpRouteId)
    const unit = boulders.find(
      item => item.sourceIdentity?.mpId === rule.mpParentId,
    )
    const climb = unit?.climbs.find(
      item => item.sourceIdentity?.mpId === rule.mpRouteId,
    )
    const observation =
      unit && climb ? matchSourceFaceRule(unit, climb, rule) : null
    if (!unit || !climb || !observation || climb.faceIds.length)
      throw new Error(
        `Source-face rule no longer matches its exact approved evidence ${rule.mpRouteId}`,
      )
    const faceId = `mp-face-${rule.mpParentId}-${rule.orientation}`
    let face = unit.faces.find(item => item.id === faceId)
    if (!face) {
      const name = `${rule.orientation[0]?.toUpperCase()}${rule.orientation.slice(1)} source face`
      face = {
        id: faceId,
        name,
        orientation: rule.orientation,
        orientationStatus: 'source-observation',
        groupingStatus: 'source-backed',
        image: {
          status: 'missing',
          reason:
            'No approved image for this source-observed face is available.',
        },
        climbIds: [],
        sourceIds: unit.coverage ? [unit.coverage.sourceId] : [],
        sourceFaceObservations: [],
        photographNote: observation.note,
      } satisfies Face
      unit.faces.push(face)
    }
    face.climbIds.push(climb.id)
    face.sourceFaceObservations?.push(observation)
    if (!face.sourceIds.includes(observation.sourceId))
      face.sourceIds.push(observation.sourceId)
    climb.faceIds = [face.id]
    climb.faceAssignmentStatus = 'source-backed'
    climb.geometry = [
      {
        status: 'missing',
        faceId: face.id,
        reason:
          'The explicit source face is retained. Image-space corridor or line placement has not been authored.',
      },
    ]
    climb.contentState = {
      status: 'blocked-lawful-image',
      confidence: 'source-observation',
      reasons: [
        observation.note,
        'An approved face image and image-space route artwork remain unavailable. Source route facts remain usable.',
      ],
    }
  }
}

/** Recomputed from promoted runtime facts; no generated source copy to drift. */
export function sourceFaceLedger(boulders: Boulder[]): SourceFaceLedgerRow[] {
  return boulders.flatMap(unit =>
    unit.faces.flatMap(face =>
      (face.sourceFaceObservations ?? []).map(observation => {
        const climb = unit.climbs.find(
          item => item.sourceIdentity?.mpId === observation.mpRouteId,
        )
        if (!climb)
          throw new Error(
            `Missing source-face ledger climb ${observation.mpRouteId}`,
          )
        return {
          ...observation,
          climbId: climb.id,
          unitId: unit.id,
          faceId: face.id,
          clusterId: unit.areaId,
        }
      }),
    ),
  )
}
