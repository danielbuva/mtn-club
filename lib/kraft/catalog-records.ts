import type { RouteFacts } from './route-facts'
import type {
  Climb,
  EvidenceSource,
  GradeObservation,
  SourceAlias,
} from './types'

/** Facts transcribed from the dated parent boulder's public route table. */
export type CatalogRoute = {
  id: string
  sourceId: string
  sourceName: string
  name: string
  routeUrl: string
  grade: string
  fontGrade: string
  gradeValue: number
  gradeMaxValue?: number
  risk?: string
  ydsGrade?: string
  aliases?: SourceAlias[]
}

export function completeCatalog(
  studiedClimbs: Climb[],
  records: CatalogRoute[],
  boulderSourceId: string,
  facts: Record<string, RouteFacts>,
): Climb[] {
  const climbs = [...studiedClimbs]
  for (const record of records) {
    let climb = climbs.find(item => item.id === record.id)
    if (!climb) {
      climb = {
        id: record.id,
        name: record.name,
        grade: record.grade,
        gradeValue: record.gradeValue,
        gradeMaxValue: record.gradeMaxValue,
        risk: record.risk,
        aliases: record.aliases,
        betaStatus: 'catalog-only',
        boulderAssignmentStatus: 'source-backed',
        status: 'source-observation',
        description:
          'Published in this boulder’s route list. Face, start, finish and movement beta await local review.',
        faceIds: [],
        faceAssignmentStatus: 'unassigned',
        geometry: [],
        sourceIds: [record.sourceId],
        gradeObservations: [],
        selectedGradeSourceId: boulderSourceId,
      }
      climbs.push(climb)
    }
    const routeFacts = facts[record.id]
    if (routeFacts) {
      climb.description = routeFacts.description
      climb.betaStatus = 'source-synopsis'
      if (routeFacts.boulderAssignmentNote) {
        climb.boulderAssignmentStatus = 'editorial-provisional'
        climb.boulderAssignmentNote = routeFacts.boulderAssignmentNote
      }
      for (const sourceId of routeFacts.sourceIds ?? [])
        if (!climb.sourceIds.includes(sourceId)) climb.sourceIds.push(sourceId)
      if (routeFacts.aliases)
        climb.aliases = [...(climb.aliases ?? []), ...routeFacts.aliases]
      if (routeFacts.gradeObservations)
        climb.gradeObservations.push(...routeFacts.gradeObservations)
      if (routeFacts.conditionObservations)
        climb.conditionObservations = routeFacts.conditionObservations
      if (routeFacts.disagreement) climb.disagreement = routeFacts.disagreement
      if (routeFacts.faceIds) {
        climb.faceIds = routeFacts.faceIds
        climb.faceAssignmentStatus = 'source-backed'
        climb.geometry = routeFacts.faceIds.map(faceId => ({
          status: 'missing',
          faceId,
          reason:
            'Route lines require a licensed face photograph and local review.',
        }))
      }
    }
    if (!climb.sourceIds.includes(boulderSourceId))
      climb.sourceIds.push(boulderSourceId)
    const grades: { grade: string; system: GradeObservation['system'] }[] = [
      { grade: record.grade, system: 'V' },
      { grade: record.fontGrade, system: 'Font' },
    ]
    if (record.ydsGrade) grades.push({ grade: record.ydsGrade, system: 'YDS' })
    for (const observation of grades)
      if (
        !climb.gradeObservations.some(
          existing =>
            existing.grade === observation.grade &&
            existing.system === observation.system &&
            existing.identityStatus === 'source-linked',
        )
      )
        climb.gradeObservations.push({
          ...observation,
          sourceId: boulderSourceId,
          sourceName: record.sourceName,
          status: 'source-observation',
          identityStatus: 'source-linked',
          note: 'Published parent boulder route table; no grade conversion inferred.',
        })
  }
  return climbs
}

export function catalogSources(records: CatalogRoute[]): EvidenceSource[] {
  return records
    .filter(record => record.sourceId.startsWith('mp-route-'))
    .map(
      (record): EvidenceSource => ({
        id: record.sourceId,
        title: record.sourceName,
        url: record.routeUrl,
        publisher: 'Mountain Project contributors',
        accessedAt: '2026-09-30',
        usage: 'factual-reference',
        note: 'Route page consulted for an original factual synopsis; no prose or media reproduced. Published grades cite the dated parent boulder table.',
      }),
    )
}
