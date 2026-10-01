import type { RuntimeMpUnit, RuntimeObUnit } from './runtime-records'
import { mpSourceId, obSourceId } from './runtime-sources.ts'
import type {
  Boulder,
  Climb,
  CoordinateObservation,
  EvidenceSource,
} from './types'

export const sectorIds: Record<string, string> = {
  '114986624': 'west-cluster',
  '114986613': 'cube-area',
  '123855477': 'main-area',
  '123855693': 'pearl-area',
  '123855862': 'east-cluster',
}

export function sectorForUnit(
  unit: RuntimeMpUnit,
  units: RuntimeMpUnit[],
): string {
  let parentId = unit.parentId
  while (parentId) {
    const sector = sectorIds[parentId]
    if (sector) return sector
    parentId = units.find(item => item.id === parentId)?.parentId ?? null
  }
  return 'openbeta-unresolved'
}

function coordinateObservation(
  coordinates: RuntimeMpUnit['coordinates'],
  sourceId: string,
  selection: CoordinateObservation['selection'],
  selectionReason: string,
): CoordinateObservation[] {
  return coordinates
    ? [
        {
          lat: coordinates.latitude,
          lon: coordinates.longitude,
          sourceId,
          status: 'source-observation',
          selection,
          selectionReason,
        },
      ]
    : []
}

export function buildMpUnit(
  unit: RuntimeMpUnit,
  pilot: Boulder | undefined,
  climbs: Climb[],
  memberships: NonNullable<Boulder['catalogMemberships']>,
  linkedUnits: RuntimeObUnit[],
  sources: EvidenceSource[],
  allUnits: RuntimeMpUnit[],
): Boulder {
  const sourceId = mpSourceId(unit.id, 'area', sources)
  const original = pilot ? structuredClone(pilot) : undefined
  const sourceClimbIds = climbs
    .filter(climb => climb.sourceIdentity?.mpId)
    .map(climb => climb.id)
  const groupNote =
    unit.id === '125752769'
      ? 'The Art Deco source catalog explicitly groups two rocks; individual physical identities remain unresolved.'
      : unit.id === '106657477'
        ? 'The Main Area Warm-up source catalog describes a pair of rocks; this unit does not identify one physical boulder.'
        : 'This is a dated MP source catalog. A leaf source area can contain multiple rocks; physical boundaries are not inferred.'
  const pilotNote =
    'Preserved pilot boulder identity and face groups are source observations. Individual provisional route memberships remain qualified; no field-verified rock boundary is claimed.'
  const comparisons = linkedUnits.flatMap(record =>
    coordinateObservation(
      record.coordinates,
      obSourceId(record.id, 'area'),
      'comparison',
      'Exact importer parent-ID comparison. OpenBeta supplies a catalog centroid, not independent field verification; no averaging is performed.',
    ),
  )
  const location =
    original?.location ??
    (unit.coordinates
      ? {
          lat: unit.coordinates.latitude,
          lon: unit.coordinates.longitude,
          status: 'source-observation' as const,
          sourceIds: [sourceId],
          note: 'Selected MP parent source point for catalog placement. This point does not establish a physical footprint or measured accuracy.',
          observations: coordinateObservation(
            unit.coordinates,
            sourceId,
            'selected',
            'Select the parent source point for this catalog. Route-page points do not replace it.',
          ),
        }
      : null)
  if (location) {
    location.scope = original ? 'boulder-point' : 'catalog-centroid'
    location.observations = [...(location.observations ?? []), ...comparisons]
  }
  const boulder: Boulder = {
    ...original,
    id: original?.id ?? `mp-area-${unit.id}`,
    name: original?.name ?? unit.name,
    aliases: original?.aliases ?? [],
    areaId: original?.areaId ?? sectorForUnit(unit, allUnits),
    areaAssignmentStatus: 'source-backed',
    unitKind: original ? 'physical-boulder' : 'source-unit',
    unitNote: original ? pilotNote : groupNote,
    sourceIdentity: {
      mpId: unit.id,
      openBetaIds: linkedUnits.map(record => record.id),
      identityStatus: 'source-linked',
    },
    coverage: {
      status: 'source-catalog',
      sourceId,
      sourceClimbCount: sourceClimbIds.length,
      sourceClimbIds,
    },
    location,
    description:
      original?.description ??
      `${unit.name} is retained as its published source catalog. Physical rock and face identification require review.`,
    approach:
      original?.approach ??
      'No reviewed approach track is available for this source unit; route-level approach observations are qualified separately.',
    sourceIds: [
      ...new Set([
        ...(original?.sourceIds ?? []),
        sourceId,
        ...linkedUnits.map(record => obSourceId(record.id, 'area')),
      ]),
    ],
    faces: original?.faces ?? [],
    climbs,
    catalogMemberships: memberships,
    aliasObservations: [
      ...(original?.aliasObservations ?? []),
      ...linkedUnits
        .filter(record => record.name !== unit.name)
        .map(record => ({
          name: record.name,
          sourceId: obSourceId(record.id, 'area'),
          identityStatus: 'source-linked' as const,
          note: 'Exact imported MP parent-ID alias; this source linkage does not independently establish physical boundaries.',
        })),
    ],
    contentState: {
      status: 'blocked-lawful-image',
      confidence: 'source-observation',
      reasons: [
        original ? pilotNote : groupNote,
        'The catalog lacks a complete set of identified lawful face images, reviewed route lines and field-reviewed positions.',
      ],
    },
  }
  if (boulder.faces.some(face => face.image.status === 'available'))
    boulder.contentState = {
      status: 'blocked-evidence',
      confidence: 'source-observation',
      reasons: [
        pilotNote,
        'A lawful context photograph is available; exact route correspondence, remaining face images and reviewed route lines are incomplete.',
      ],
    }
  return boulder
}

export function buildUnmatchedObUnit(
  unit: RuntimeObUnit,
  climbs: Climb[],
  climbIds: string[],
): Boulder {
  const sourceId = obSourceId(unit.id, 'area')
  const observations = coordinateObservation(
    unit.coordinates,
    sourceId,
    'selected',
    'Select only the published source catalog centroid. Physical rock identity and precise position are unresolved; no name-only placement is inferred.',
  )
  return {
    id: `ob-area-${unit.id}`,
    name: unit.name,
    aliases: [],
    areaId: 'openbeta-unresolved',
    areaAssignmentStatus: 'editorial-provisional',
    unitKind: 'unresolved-unit',
    unitNote:
      'Separate OpenBeta source catalog without an exact current MP parent-ID link. Its route memberships do not resolve physical rock identity.',
    sourceIdentity: {
      mpId: null,
      openBetaIds: [unit.id],
      identityStatus: 'unresolved',
    },
    coverage: {
      status: 'source-catalog',
      sourceId,
      sourceClimbCount: climbIds.length,
      sourceClimbIds: climbIds,
    },
    location: unit.coordinates
      ? {
          lat: unit.coordinates.latitude,
          lon: unit.coordinates.longitude,
          status: 'source-observation',
          scope: 'catalog-centroid',
          sourceIds: [sourceId],
          observations,
          note: 'Published OpenBeta source catalog centroid only. Physical identity and precise rock position are unresolved; the synthetic source extent is not a rock footprint.',
        }
      : null,
    description:
      'Unmatched source catalog retained separately, with exact linked route references and unresolved native entries where available.',
    approach:
      'A reviewed approach and identified physical rock are not available for this catalog.',
    sourceIds: [sourceId],
    faces: [],
    climbs,
    catalogMemberships: [
      {
        sourceId,
        climbIds,
        note: 'Exact source membership only. Linked canonical MP climbs are referenced here rather than duplicated or moved.',
      },
    ],
    contentState: {
      status: 'blocked-identity',
      confidence: 'identity-unresolved',
      reasons: [
        'No exact current MP parent-ID identity link exists.',
        'The source centroid is not a verified rock position; identified lawful face images and reviewed route lines are unavailable.',
      ],
    },
  }
}
