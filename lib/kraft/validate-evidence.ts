import type { Boulder, SourceAlias } from './types'
import { validateSelectedGrade } from './validate-grades.ts'

export function validateBoulderEvidence(
  boulder: Boulder,
  sources: Set<string>,
): string[] {
  const errors: string[] = []
  if (
    !boulder.areaAssignmentStatus ||
    !['source-backed', 'editorial-provisional'].includes(
      boulder.areaAssignmentStatus,
    )
  )
    errors.push(`${boulder.id}: area assignment qualifier missing or invalid`)
  function source(owner: string, id: string) {
    if (!sources.has(id)) errors.push(`${owner}: unknown evidence source ${id}`)
  }
  function aliases(owner: string, observations: SourceAlias[]) {
    for (const alias of observations) {
      source(`${owner} alias`, alias.sourceId)
      if (!alias.name.trim()) errors.push(`${owner}: empty alias`)
      if (!['source-linked', 'unresolved'].includes(alias.identityStatus))
        errors.push(`${owner}: alias identity qualifier missing`)
      if (alias.identityStatus === 'unresolved' && !alias.note?.trim())
        errors.push(`${owner}: unresolved alias rationale missing`)
    }
  }
  aliases(boulder.id, boulder.aliasObservations ?? [])
  for (const alias of boulder.aliases)
    if (
      !boulder.aliasObservations?.some(
        observation =>
          observation.name === alias &&
          observation.identityStatus === 'source-linked',
      )
    )
      errors.push(`${boulder.id}: canonical alias has no linked source`)

  const observations = boulder.location.observations ?? []
  const selected = observations.filter(
    observation => observation.selection === 'selected',
  )
  if (selected.length !== 1)
    errors.push(
      `${boulder.id}: exactly one selected coordinate observation required`,
    )
  for (const observation of observations) {
    source(`${boulder.id} coordinate`, observation.sourceId)
    if (
      !Number.isFinite(observation.lat) ||
      Math.abs(observation.lat) > 90 ||
      !Number.isFinite(observation.lon) ||
      Math.abs(observation.lon) > 180
    )
      errors.push(`${boulder.id}: invalid coordinate observation`)
    if (!observation.selectionReason.trim())
      errors.push(`${boulder.id}: coordinate selection rationale missing`)
    if (
      observation.selection === 'selected' &&
      (observation.lat !== boulder.location.lat ||
        observation.lon !== boulder.location.lon ||
        !boulder.location.sourceIds.includes(observation.sourceId))
    )
      errors.push(
        `${boulder.id}: plotted coordinate contradicts selected observation`,
      )
  }
  for (const id of boulder.location.sourceIds)
    if (!selected.some(observation => observation.sourceId === id))
      errors.push(`${boulder.id}: coordinate source is not selected`)

  if (boulder.coverage) {
    source(`${boulder.id} coverage`, boulder.coverage.sourceId)
    if (
      !Number.isInteger(boulder.coverage.sourceClimbCount) ||
      boulder.coverage.sourceClimbCount < boulder.climbs.length
    )
      errors.push(`${boulder.id}: invalid coverage count`)
    if (
      boulder.coverage.status === 'source-catalog' &&
      boulder.coverage.sourceClimbCount !== boulder.climbs.length
    )
      errors.push(`${boulder.id}: source catalog coverage is incomplete`)
  }
  for (const face of boulder.faces)
    if (!face.groupingStatus) errors.push(`${face.id}: grouping status missing`)
  for (const climb of boulder.climbs) {
    errors.push(...validateSelectedGrade(climb))
    if (
      !climb.boulderAssignmentStatus ||
      !['source-backed', 'editorial-provisional'].includes(
        climb.boulderAssignmentStatus,
      )
    )
      errors.push(
        `${climb.id}: physical boulder assignment qualifier missing or invalid`,
      )
    if (
      climb.boulderAssignmentStatus === 'editorial-provisional' &&
      !climb.boulderAssignmentNote?.trim()
    )
      errors.push(`${climb.id}: unresolved physical boulder rationale missing`)
    aliases(climb.id, climb.aliases ?? [])
    if (
      !climb.faceAssignmentStatus ||
      (!climb.faceIds.length && climb.faceAssignmentStatus !== 'unassigned') ||
      (climb.faceIds.length && climb.faceAssignmentStatus === 'unassigned')
    )
      errors.push(`${climb.id}: face assignment qualifier inconsistent`)
    for (const observation of climb.gradeObservations) {
      if (
        !observation.identityStatus ||
        !['source-linked', 'unresolved'].includes(observation.identityStatus) ||
        !observation.sourceName?.trim()
      )
        errors.push(`${climb.id}: grade identity qualifier missing`)
      if (
        observation.identityStatus === 'unresolved' &&
        !observation.note?.trim()
      )
        errors.push(`${climb.id}: unresolved grade identity rationale missing`)
    }
    for (const observation of climb.conditionObservations ?? []) {
      source(`${climb.id} condition`, observation.sourceId)
      if (
        !['source-linked', 'unresolved'].includes(observation.identityStatus) ||
        !observation.sourceName.trim() ||
        !observation.note.trim()
      )
        errors.push(
          `${climb.id}: condition identity qualifier or rationale missing`,
        )
    }
    if (
      climb.boulderAssignmentStatus === 'editorial-provisional' &&
      climb.faceAssignmentStatus === 'source-backed'
    )
      errors.push(
        `${climb.id}: source-backed face uses unresolved physical boulder membership`,
      )
    if (
      climb.faceAssignmentStatus === 'source-backed' &&
      climb.faceIds.some(
        id =>
          boulder.faces.find(face => face.id === id)?.groupingStatus !==
          'source-backed',
      )
    )
      errors.push(
        `${climb.id}: source-backed face assignment uses provisional physical grouping`,
      )
    if (
      climb.boulderAssignmentStatus === 'editorial-provisional' &&
      climb.geometry.some(geometry => geometry.status === 'authored')
    )
      errors.push(
        `${climb.id}: authored geometry uses unresolved physical boulder membership`,
      )
    if (
      climb.geometry.some(geometry => geometry.status === 'authored') &&
      (climb.faceAssignmentStatus === 'editorial-provisional' ||
        climb.faceIds.some(
          id =>
            boulder.faces.find(face => face.id === id)?.groupingStatus ===
            'editorial-provisional',
        ))
    )
      errors.push(
        `${climb.id}: authored geometry uses provisional face grouping`,
      )
  }
  return errors
}
