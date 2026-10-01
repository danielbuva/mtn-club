import type { RuntimeMpRoute, RuntimeObRoute } from './runtime-records'
import {
  gradeBounds,
  hasRouteFacts,
  obGrades,
  parentObservation,
  routeCoordinate,
  structuredFacts,
} from './runtime-route-evidence.ts'
import { mpSourceId, obSourceId } from './runtime-sources.ts'
import type { Climb, EvidenceSource, Face, GradeObservation } from './types'

export type RouteBuildContext = {
  sources: EvidenceSource[]
  unitIdForMp: (id: string) => string | null
  unitIdForOb: (id: string) => string | null
}

function contentState(climb: Climb, faces: Face[], identityConflict: boolean) {
  const reasons = [
    climb.betaStatus === 'source-synopsis'
      ? 'Original source-qualified route facts are available; they do not verify a physical line.'
      : 'The source catalog does not supply usable route start, path or finish facts.',
    'Route geometry and current conditions require a documented field review.',
  ]
  if (identityConflict)
    return {
      status: 'blocked-identity',
      confidence: 'identity-unresolved',
      reasons: [
        ...reasons,
        'Physical membership or original source identity is unresolved; review the qualified parent and source observations.',
      ],
    } satisfies NonNullable<Climb['contentState']>
  if (!climb.faceIds.length)
    return {
      status: 'blocked-evidence',
      confidence: 'source-observation',
      reasons: [
        ...reasons,
        'No reviewed face/corridor assignment exists for this source record.',
      ],
    } satisfies NonNullable<Climb['contentState']>
  if (
    climb.faceIds.some(
      id => faces.find(face => face.id === id)?.image.status !== 'available',
    )
  )
    return {
      status: 'blocked-lawful-image',
      confidence: 'source-observation',
      reasons: [
        ...reasons,
        'An identified lawful photograph of the assigned face is missing.',
      ],
    } satisfies NonNullable<Climb['contentState']>
  return {
    status: 'blocked-evidence',
    confidence: 'source-observation',
    reasons: [
      ...reasons,
      'A lawful context image exists, but reviewed route lines and exact photograph correspondence are missing.',
    ],
  } satisfies NonNullable<Climb['contentState']>
}

function mpGrades(
  record: RuntimeMpRoute,
  sourceId: string,
): GradeObservation[] {
  const values: { grade: string; system: GradeObservation['system'] }[] = [
    { grade: record.grades.v, system: 'V' },
    { grade: record.grades.font, system: 'Font' },
    { grade: record.grades.yds, system: 'YDS' },
  ]
  return values
    .filter(value => value.grade)
    .map(value => ({
      ...value,
      sourceId,
      sourceName: record.name,
      status: 'source-observation',
      identityStatus: 'source-linked',
      sourceDependency: 'primary-source-page',
      note: 'Verbatim dated MP grade metadata. No grade conversion or consensus is inferred.',
    }))
}

export function buildMpRoute(
  record: RuntimeMpRoute,
  linked: RuntimeObRoute[],
  pilot: Climb | undefined,
  faces: Face[],
  context: RouteBuildContext,
): Climb {
  const sourceId = mpSourceId(record.id, 'route', context.sources)
  const parentId = record.parentIds[0]
  if (!parentId) throw new Error(`Missing MP parent for ${record.id}`)
  const parentSourceId = mpSourceId(parentId, 'area', context.sources)
  const routeFacts = structuredFacts(
    record.dossier.observations,
    record.dossier.discrepancyNotes,
    context.sources,
  )
  const climb: Climb = pilot
    ? structuredClone(pilot)
    : {
        id: `mp-route-${record.id}`,
        name: record.name,
        grade: record.grades.v || record.grades.yds || record.grades.font,
        ...gradeBounds(record.grades.v),
        gradeObservations: [],
        selectedGradeSourceId: sourceId,
        status: 'source-observation',
        description:
          routeFacts.observations[0]?.synopsis ??
          'Source catalog entry; route facts require review.',
        faceIds: [],
        faceAssignmentStatus: 'unassigned',
        geometry: [],
        sourceIds: [],
        boulderAssignmentStatus: 'source-backed',
        boulderAssignmentNote:
          'Assignment to the dated MP source catalog; physical rock boundaries are not inferred.',
      }
  climb.betaStatus =
    pilot?.betaStatus === 'source-synopsis' || hasRouteFacts(routeFacts)
      ? 'source-synopsis'
      : 'catalog-only'
  climb.routeFacts = routeFacts
  climb.sourceIdentity = {
    mpId: record.id,
    openBetaIds: linked.map(item => item.id),
    identityStatus: 'source-linked',
  }
  climb.coordinateObservations = routeCoordinate(record.coordinates, sourceId)
  climb.gradeObservations.push(
    ...mpGrades(record, sourceId),
    ...linked.flatMap(obGrades),
  )
  climb.risk ??= record.grades.risk || undefined
  climb.riskObservations = record.grades.risk
    ? [
        {
          risk: record.grades.risk,
          sourceId,
          status: 'source-observation',
          sourceDependency: 'primary-source-page',
          note: 'Verbatim dated MP risk notation; this is not a current field assessment.',
        },
      ]
    : []
  climb.parentObservations = [
    {
      sourceId,
      parentSourceId,
      parentUnitId: context.unitIdForMp(parentId),
      identityStatus: 'source-linked',
      sourceDependency: 'primary-source-page',
      note: 'Current exact MP parent source catalog; no physical rock boundary is inferred.',
    },
    ...linked.map(item =>
      parentObservation(
        obSourceId(item.id, 'route'),
        obSourceId(item.parentId, 'area'),
        context.unitIdForOb(item.parentId),
        item.originalMpId,
        item.parentReconciliation?.status === 'same-numeric-source-parent'
          ? 'Exact importer numeric IDs link the source parents; correlated catalog membership does not independently verify a rock.'
          : `OpenBeta source membership ${item.parentId} differs from, or has no exact link to, current MP parent ${parentId}. Both memberships are retained; no name-only reconciliation is inferred.`,
        item.parentReconciliation?.openbetaParentMappedMpId
          ? 'source-linked'
          : 'unresolved',
      ),
    ),
  ]
  climb.aliases = [
    ...(climb.aliases ?? []),
    ...linked
      .filter(item => item.name !== climb.name)
      .map(item => ({
        name: item.name,
        sourceId: obSourceId(item.id, 'route'),
        identityStatus: 'source-linked' as const,
        note: 'Exact original MP numeric-ID link; spelling or catalog label differs. No name-only merge is used.',
      })),
  ]
  climb.sourceIds = [
    ...new Set([
      ...climb.sourceIds,
      sourceId,
      parentSourceId,
      ...routeFacts.observations.map(item => item.sourceId),
      ...climb.parentObservations.flatMap(item => [
        item.sourceId,
        item.parentSourceId,
      ]),
    ]),
  ]
  if (routeFacts.discrepancyNotes.length)
    climb.disagreement = [climb.disagreement, ...routeFacts.discrepancyNotes]
      .filter(Boolean)
      .join(' ')
  const identityConflict =
    climb.boulderAssignmentStatus === 'editorial-provisional' ||
    linked.some(
      item =>
        item.parentReconciliation?.status !== 'same-numeric-source-parent',
    )
  climb.contentState = contentState(climb, faces, identityConflict)
  return climb
}

export function buildUnlinkedObRoute(
  record: RuntimeObRoute,
  context: RouteBuildContext,
): Climb {
  if (!record.nativeFacts)
    throw new Error(`Missing original synopsis for OB entry ${record.id}`)
  const sourceId = obSourceId(record.id, 'route')
  const routeFacts = structuredFacts([record.nativeFacts], [], context.sources)
  const grade =
    record.grades.vscale || record.grades.yds || record.grades.font || 'Unknown'
  const climb: Climb = {
    id: `ob-route-${record.id}`,
    name: record.name,
    grade,
    ...gradeBounds(grade),
    gradeObservations: obGrades(record),
    selectedGradeSourceId: sourceId,
    status: 'source-observation',
    betaStatus: hasRouteFacts(routeFacts) ? 'source-synopsis' : 'catalog-only',
    boulderAssignmentStatus: 'editorial-provisional',
    boulderAssignmentNote:
      'Retained under the exact OpenBeta parent catalog. Original route identity and physical membership are unresolved.',
    description: record.nativeFacts.synopsis,
    faceIds: [],
    faceAssignmentStatus: 'unassigned',
    geometry: [],
    sourceIds: [sourceId, obSourceId(record.parentId, 'area')],
    sourceIdentity: {
      mpId: null,
      openBetaIds: [record.id],
      identityStatus: 'unresolved',
    },
    routeFacts,
    parentObservations: [
      parentObservation(
        sourceId,
        obSourceId(record.parentId, 'area'),
        context.unitIdForOb(record.parentId),
        null,
        'Exact OpenBeta catalog parent. A mapped parent ID does not resolve the unlinked route identity.',
      ),
    ],
    risk:
      record.safety && record.safety !== 'UNSPECIFIED'
        ? record.safety
        : undefined,
  }
  climb.contentState = contentState(climb, [], true)
  return climb
}
