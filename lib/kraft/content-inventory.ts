import mp from './mp-inventory.json' with { type: 'json' }
import openbeta from './openbeta-inventory.json' with { type: 'json' }

export type ContentState =
  | 'COMPLETE'
  | 'PARTIAL usable'
  | 'BLOCKED lawful image'
  | 'BLOCKED route geometry/missing evidence'
  | 'BLOCKED identity/conflict'
  | 'EXCLUDED'

export type ContentObservation = {
  id: string
  canonicalId: string
  kind: 'area' | 'source-unit' | 'route'
  source: 'Mountain Project' | 'OpenBeta'
  name: string
  grade: string
  ydsGrade: string
  fontGrade: string
  parentId: string | null
  canonicalParentId: string | null
  url: string
  retrievedAt: string
  coordinate: { latitude: number; longitude: number } | null
  identity: string
  conflict: string
}

export type ContentRecord = {
  id: string
  kind: ContentObservation['kind']
  name: string
  grade: string
  state: ContentState
  reasons: string[]
  observations: ContentObservation[]
}

/** Exact importer IDs link records. Similar names alone never establish identity. */
export const contentObservations: ContentObservation[] = [
  ...mp.areas.map(
    (area): ContentObservation => ({
      id: `mp-area-${area.id}`,
      canonicalId: `mp-area-${area.id}`,
      kind: area.kind === 'source-boulder-unit' ? 'source-unit' : 'area',
      source: 'Mountain Project',
      name: area.name,
      grade: '',
      ydsGrade: '',
      fontGrade: '',
      parentId: area.parentId ? `mp-area-${area.parentId}` : null,
      canonicalParentId: area.parentId ? `mp-area-${area.parentId}` : null,
      url: area.url,
      retrievedAt: area.retrievedAt,
      coordinate: area.coordinates,
      identity:
        'Source hierarchy unit; physical boundaries need reconciliation.',
      conflict: '',
    }),
  ),
  ...mp.routes.map(
    (route): ContentObservation => ({
      id: `mp-route-${route.id}`,
      canonicalId: `mp-route-${route.id}`,
      kind: 'route',
      source: 'Mountain Project',
      name: route.name,
      grade: route.grades.v || route.grades.yds,
      ydsGrade: route.grades.yds,
      fontGrade: route.grades.font,
      parentId: `mp-area-${route.parentIds[0]}`,
      canonicalParentId: `mp-area-${route.parentIds[0]}`,
      url: route.url,
      retrievedAt: route.retrievedAt,
      coordinate: route.coordinates,
      identity: 'Current numeric source route ID; not field verification.',
      conflict: route.parentIds.length > 1 ? 'Multiple source parents.' : '',
    }),
  ),
  ...openbeta.areas.map((area): ContentObservation => {
    const parent = openbeta.areas.find(item => item.id === area.parentId)
    return {
      id: `ob-area-${area.id}`,
      canonicalId: area.originalMpId
        ? `mp-area-${area.originalMpId}`
        : `ob-area-${area.id}`,
      kind: area.leaf ? 'source-unit' : 'area',
      source: 'OpenBeta',
      name: area.name,
      grade: '',
      ydsGrade: '',
      fontGrade: '',
      parentId: area.parentId ? `ob-area-${area.parentId}` : null,
      canonicalParentId: parent?.originalMpId
        ? `mp-area-${parent.originalMpId}`
        : area.parentId
          ? `ob-area-${area.parentId}`
          : null,
      url: area.sourceUrl,
      retrievedAt: area.retrievedAt,
      coordinate: area.coordinates,
      identity: area.identifierLinkMethod,
      conflict: area.originalMpId ? '' : 'Physical/source identity unresolved.',
    }
  }),
  ...openbeta.routes.map((route): ContentObservation => {
    const parent = openbeta.areas.find(item => item.id === route.parentId)
    const parentConflict =
      route.parentReconciliation?.status === 'source-parent-conflict'
    const unmatchedParent =
      route.parentReconciliation?.status === 'openbeta-parent-unmatched'
    return {
      id: `ob-route-${route.id}`,
      canonicalId: route.originalMpId
        ? `mp-route-${route.originalMpId}`
        : `ob-route-${route.id}`,
      kind: 'route',
      source: 'OpenBeta',
      name: route.name,
      grade: route.grades.vscale ?? route.grades.yds ?? '',
      ydsGrade: route.grades.yds?.startsWith('5.') ? route.grades.yds : '',
      fontGrade: route.grades.font ?? '',
      parentId: `ob-area-${route.parentId}`,
      canonicalParentId: parent?.originalMpId
        ? `mp-area-${parent.originalMpId}`
        : `ob-area-${route.parentId}`,
      url: route.sourceUrl,
      retrievedAt: route.retrievedAt,
      coordinate: null,
      identity: `${route.identifierLinkMethod} ${route.sourceDependency}`,
      conflict: parentConflict
        ? 'Current MP and OpenBeta source parents conflict.'
        : unmatchedParent
          ? 'Exact route ID is linked, but OpenBeta physical parent identity is unresolved.'
          : route.originalMpId
            ? ''
            : 'Route identity/origin unresolved; do not merge by name.',
    }
  }),
]

export function reconcileContent(): ContentRecord[] {
  const records = new Map<string, ContentRecord>()
  for (const observation of contentObservations) {
    let record = records.get(observation.canonicalId)
    if (!record) {
      record = {
        id: observation.canonicalId,
        kind: observation.kind,
        name: observation.name,
        grade: observation.grade,
        state:
          observation.kind === 'area'
            ? 'PARTIAL usable'
            : observation.kind === 'route'
              ? 'BLOCKED route geometry/missing evidence'
              : 'BLOCKED lawful image',
        reasons:
          observation.kind === 'area'
            ? ['Source hierarchy indexed; expanded runtime coverage pending.']
            : observation.kind === 'route'
              ? [
                  'Face, independent corridor evidence and approved overlay pending.',
                ]
              : [
                  'Physical unit boundary, approved face imagery and map audit pending.',
                ],
        observations: [],
      }
      records.set(record.id, record)
    }
    record.observations.push(observation)
    if (observation.conflict) {
      record.state = 'BLOCKED identity/conflict'
      if (!record.reasons.includes(observation.conflict))
        record.reasons.push(observation.conflict)
    }
  }
  for (const record of records.values()) {
    // Compare reported grades within their systems. A YDS observation can
    // agree with one part of an MP mixed YDS/V record without reporting V.
    const gradeSystems = [
      record.observations
        .map(observation =>
          observation.grade.startsWith('V') ? observation.grade : '',
        )
        .filter(Boolean),
      record.observations
        .map(observation => observation.ydsGrade)
        .filter(Boolean),
      record.observations
        .map(observation => observation.fontGrade)
        .filter(Boolean),
    ]
    if (gradeSystems.some(grades => new Set(grades).size > 1))
      record.reasons.push(
        'Source grades differ; inventory label is provisional, not an averaged grade.',
      )
    const names = new Set(
      record.observations.map(observation => observation.name),
    )
    if (names.size > 1)
      record.reasons.push(
        'Source names differ; exact importer identity links entries, not spelling alone.',
      )
  }
  return [...records.values()]
}

export const contentSourceCounts = {
  mountainProject: { areas: mp.areas.length, routes: mp.routes.length },
  openbeta: { areas: openbeta.areas.length, routes: openbeta.routes.length },
}
