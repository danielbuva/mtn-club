import type { SourceFaceOrientation } from './source-face-types'
import type { SourceViewFactRule } from './source-view-rules.ts'
import { sourceViewGroups } from './source-view-rules.ts'
import type { Boulder, Climb, Face } from './types'

export type SourceViewEvidence = SourceViewFactRule & {
  sourceId: string
  retrievedAt: string
}

export type SourceViewObservation = SourceViewEvidence & {
  mpParentId: string
  orientation: SourceFaceOrientation | 'unknown'
  scope: 'source-catalog-view'
  relationEvidence: SourceViewEvidence[]
  note: string
}

const qualification =
  'This is a source-qualified catalog view, not a surveyed physical face or shared camera view. Cardinal labels repeat the described region or corner; front, back and relative positions do not establish a compass aspect. Starts or continuations can extend beyond this view.'

function exactEvidence(
  unit: Boulder,
  rule: SourceViewFactRule,
): { climb: Climb; evidence: SourceViewEvidence } {
  const climb = unit.climbs.find(
    item => item.sourceIdentity?.mpId === rule.mpRouteId,
  )
  const parents = climb?.parentObservations ?? []
  const observation = climb?.routeFacts?.observations.find(
    item =>
      item.publisher === 'Mountain Project' &&
      item.sourceDependency === 'primary-source-page' &&
      item.facts[rule.factField].includes(rule.sourceFact) &&
      climb.sourceIds.includes(item.sourceId),
  )
  if (
    !climb ||
    climb.boulderAssignmentStatus !== 'source-backed' ||
    !parents.length ||
    parents.some(
      parent =>
        parent.identityStatus === 'source-linked' &&
        parent.parentUnitId !== unit.id,
    ) ||
    !observation
  )
    throw new Error(
      `Source-view evidence no longer matches exact route-parent facts ${rule.mpRouteId}`,
    )
  return {
    climb,
    evidence: {
      ...rule,
      sourceId: observation.sourceId,
      retrievedAt: observation.retrievedAt,
    },
  }
}

/** Controlled exact facts only; leaves existing face assignments intact. */
export function applySourceViewAssignments(boulders: Boulder[]): void {
  const assigned = new Set<string>()
  for (const group of sourceViewGroups) {
    const unit = boulders.find(
      item => item.sourceIdentity?.mpId === group.mpParentId,
    )
    if (!unit)
      throw new Error(`Missing exact source-view parent ${group.mpParentId}`)
    const relations = group.relations.map(
      rule => exactEvidence(unit, rule).evidence,
    )
    const pending = Object.entries(group.routes).flatMap(
      ([mpRouteId, fact]) => {
        if (assigned.has(mpRouteId))
          throw new Error(`Duplicate controlled source-view route ${mpRouteId}`)
        assigned.add(mpRouteId)
        const { climb, evidence } = exactEvidence(unit, {
          mpRouteId,
          factField: typeof fact === 'string' ? 'face' : fact.factField,
          sourceFact: typeof fact === 'string' ? fact : fact.sourceFact,
        })
        return climb.faceIds.length ? [] : [{ climb, evidence }]
      },
    )
    if (!pending.length) continue
    const faceId = group.faceId ?? `mp-view-${group.mpParentId}-${group.key}`
    const assignmentStatus = group.assignmentStatus ?? 'source-backed'
    const existing = unit.faces.find(face => face.id === faceId)
    if (existing?.image.status === 'available')
      throw new Error(`Source view cannot replace approved imagery ${faceId}`)
    const observations: SourceViewObservation[] = pending.map(
      ({ evidence }) => ({
        ...evidence,
        mpParentId: group.mpParentId,
        orientation: group.orientation,
        scope: 'source-catalog-view',
        relationEvidence: relations,
        note: qualification,
      }),
    )
    const viewSources = [
      ...new Set([
        ...observations.map(item => item.sourceId),
        ...relations.map(item => item.sourceId),
      ]),
    ]
    const face: Face = existing ?? {
      id: faceId,
      name: `${group.key[0]?.toUpperCase()}${group.key.slice(1).replaceAll('-', ' ')} source view`,
      orientation: group.orientation,
      orientationStatus:
        group.orientation === 'unknown' ? 'unknown' : 'source-observation',
      groupingStatus: assignmentStatus,
      image: {
        status: 'missing',
        reason:
          assignmentStatus === 'editorial-provisional'
            ? 'Nearby named features form a provisional view; its physical face boundary is unverified. An approved image is missing.'
            : 'An approved, identified image of this source view is missing.',
      },
      climbIds: [],
      sourceIds: unit.coverage ? [unit.coverage.sourceId] : [],
    }
    face.sourceViewObservations = observations
    face.sourceIds = [...new Set([...face.sourceIds, ...viewSources])]
    face.photographNote = [
      qualification,
      ...observations.map(item => `${item.sourceId}: ${item.sourceFact}`),
      ...relations.map(item => `${item.sourceId}: ${item.sourceFact}`),
      'No approved photograph or image-space route geometry is supplied.',
    ].join(' ')
    if (!existing) unit.faces.push(face)
    for (const { climb, evidence } of pending) {
      face.climbIds.push(climb.id)
      climb.faceIds = [face.id]
      climb.faceAssignmentStatus = assignmentStatus
      climb.sourceIds = [
        ...new Set([
          ...climb.sourceIds,
          evidence.sourceId,
          ...relations.map(item => item.sourceId),
        ]),
      ]
      climb.geometry = [
        {
          status: 'missing',
          faceId: face.id,
          reason:
            'The qualified source view is retained; image correspondence and route placement remain unauthored.',
        },
      ]
      const original = climb.contentState
      climb.contentState = {
        status:
          original?.status === 'blocked-identity'
            ? 'blocked-identity'
            : 'blocked-lawful-image',
        confidence:
          original?.status === 'blocked-identity'
            ? original.confidence
            : 'source-observation',
        reasons: [
          ...(original?.status === 'blocked-identity' ? original.reasons : []),
          qualification,
          'An approved image and image-space artwork are unavailable. Original route facts and parent observations remain unchanged.',
        ],
      }
    }
  }
}
