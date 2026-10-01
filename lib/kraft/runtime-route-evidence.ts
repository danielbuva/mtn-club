import type { RuntimeFactObservation, RuntimeObRoute } from './runtime-records'
import { mpSourceId, obSourceId } from './runtime-sources.ts'
import type {
  CoordinateObservation,
  EvidenceSource,
  GradeObservation,
  ParentObservation,
  RouteFactObservation,
  StructuredRouteFacts,
} from './types'

export function gradeBounds(grade: string): {
  gradeValue: number | null
  gradeMaxValue?: number
} {
  const normalized = grade.trim().toUpperCase().replaceAll(/[–—−]/g, '-')
  if (normalized === 'V-EASY' || normalized === 'VB') return { gradeValue: -1 }
  const match = /^V(\d+)(?:-(\d+)|[+-])?$/.exec(normalized)
  if (!match) return { gradeValue: null }
  return {
    gradeValue: Number(match[1]),
    ...(match[2] ? { gradeMaxValue: Number(match[2]) } : {}),
  }
}

export function obGrades(record: RuntimeObRoute): GradeObservation[] {
  const entries: {
    grade: string | null | undefined
    system: GradeObservation['system']
  }[] = [
    { grade: record.grades.vscale, system: 'V' },
    { grade: record.grades.font, system: 'Font' },
    // The importer sometimes repeats a V grade in its yds field. Keep its
    // verbatim V observation, without relabeling it as a Yosemite grade.
    {
      grade: record.grades.yds?.startsWith('5.') ? record.grades.yds : null,
      system: 'YDS',
    },
  ]
  return entries.flatMap(entry =>
    entry.grade
      ? [
          {
            grade: entry.grade,
            system: entry.system,
            sourceId: obSourceId(record.id, 'route'),
            sourceName: record.name,
            status: 'source-observation',
            identityStatus: 'source-linked',
            sourceDependency: record.originalMpId
              ? 'correlated-mp-import'
              : 'origin-unresolved',
            note: record.originalMpId
              ? 'Exact-ID importer observation; correlated MP lineage does not independently corroborate a grade.'
              : 'Grade of this exact OpenBeta entry. Its MP identity and physical line remain unresolved.',
          } satisfies GradeObservation,
        ]
      : [],
  )
}

export function structuredFacts(
  observations: RuntimeFactObservation[],
  discrepancyNotes: string[],
  sources: EvidenceSource[],
): StructuredRouteFacts {
  const normalized: RouteFactObservation[] = observations.map(observation => ({
    sourceId:
      observation.source === 'Mountain Project'
        ? mpSourceId(observation.sourceId, 'route', sources)
        : obSourceId(observation.sourceId, 'route'),
    publisher: observation.source,
    retrievedAt: observation.retrievedAt,
    sourceDependency: observation.sourceDependency,
    sectionAvailability: observation.sectionAvailability,
    facts: observation.facts,
    synopsis: observation.synopsis,
    unresolved: observation.unresolved,
  }))
  const selected =
    normalized.find(
      observation => observation.publisher === 'Mountain Project',
    ) ?? normalized[0]
  if (!selected)
    throw new Error('A route dossier must have its source observation.')
  return {
    ...selected.facts,
    observations: normalized,
    discrepancyNotes,
    unresolved: [
      ...new Set(normalized.flatMap(observation => observation.unresolved)),
    ],
  }
}

export function hasRouteFacts(facts: StructuredRouteFacts): boolean {
  return [
    facts.face,
    facts.start,
    facts.path,
    facts.finish,
    facts.constraints,
    facts.approach,
  ].some(values => values.length > 0)
}

export function parentObservation(
  sourceId: string,
  parentSourceId: string,
  parentUnitId: string | null,
  originalMpId: string | null,
  note: string,
  identityStatus: ParentObservation['identityStatus'] = originalMpId
    ? 'source-linked'
    : 'unresolved',
): ParentObservation {
  return {
    sourceId,
    parentSourceId,
    parentUnitId,
    identityStatus,
    sourceDependency: originalMpId
      ? 'correlated-mp-import'
      : 'origin-unresolved',
    note,
  }
}

export function routeCoordinate(
  coordinates: { latitude: number; longitude: number } | null,
  sourceId: string,
): CoordinateObservation[] {
  if (!coordinates) return []
  return [
    {
      lat: coordinates.latitude,
      lon: coordinates.longitude,
      sourceId,
      status: 'source-observation',
      selection: 'comparison',
      selectionReason:
        'Individual route-page coordinate retained as an observation. Catalog placement uses the parent source point; no route point replaces or averages that point.',
    },
  ]
}
