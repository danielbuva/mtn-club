import type { ContentState, KraftGuide } from './types'

/** Source catalogs can be incomplete, but their references and claims must agree. */
export function validateCatalogRecords(guide: KraftGuide): string[] {
  const errors: string[] = []
  const sources = new Map(guide.sources.map(source => [source.id, source]))
  const units = new Set(guide.boulders.map(unit => unit.id))
  const climbs = new Set(
    guide.boulders.flatMap(unit => unit.climbs.map(climb => climb.id)),
  )
  function source(owner: string, id: string) {
    if (!sources.has(id)) errors.push(`${owner}: unknown evidence source ${id}`)
  }
  function state(owner: string, value: ContentState | undefined) {
    if (!value) {
      if (guide.status === 'catalog')
        errors.push(`${owner}: explicit catalog content state missing`)
      return
    }
    if (
      !Array.isArray(value.reasons) ||
      !value.reasons.length ||
      value.reasons.some(reason => typeof reason !== 'string' || !reason.trim())
    )
      errors.push(`${owner}: catalog content state requires explicit reasons`)
    if (value.status === 'complete' && value.confidence !== 'field-verified')
      errors.push(
        `${owner}: complete catalog content requires field verification`,
      )
  }
  for (const unit of guide.boulders) {
    state(unit.id, unit.contentState)
    if (!unit.location && !unit.contentState)
      errors.push(
        `${unit.id}: unlocated catalog requires an explicit evidence state`,
      )
    if (
      unit.unitKind &&
      unit.unitKind !== 'physical-boulder' &&
      !unit.unitNote?.trim()
    )
      errors.push(
        `${unit.id}: source unit requires a physical identity qualification`,
      )
    if (
      unit.location?.scope === 'catalog-centroid' &&
      unit.location.status === 'field-verified'
    )
      errors.push(
        `${unit.id}: source catalog centroid cannot be a field rock position`,
      )
    if (
      unit.contentState?.confidence === 'field-verified' &&
      (unit.unitKind !== 'physical-boulder' ||
        unit.location?.status !== 'field-verified' ||
        !unit.location.review?.reviewer?.trim())
    )
      errors.push(
        `${unit.id}: catalog field confidence requires reviewed physical location`,
      )
    if (
      unit.contentState?.status === 'complete' &&
      (!unit.climbs.length ||
        unit.climbs.some(climb => climb.contentState?.status !== 'complete'))
    )
      errors.push(
        `${unit.id}: complete catalog requires complete route records`,
      )
    for (const membership of unit.catalogMemberships ?? []) {
      source(`${unit.id} membership`, membership.sourceId)
      if (!membership.note.trim())
        errors.push(`${unit.id}: catalog membership qualification missing`)
      if (new Set(membership.climbIds).size !== membership.climbIds.length)
        errors.push(`${unit.id}: duplicate catalog membership route`)
      for (const id of membership.climbIds)
        if (!climbs.has(id))
          errors.push(`${unit.id}: unknown catalog membership route ${id}`)
    }
    for (const id of unit.coverage?.sourceClimbIds ?? [])
      if (!climbs.has(id)) {
        errors.push(`${unit.id}: unknown source coverage route ${id}`)
        if (unit.coverage?.status === 'source-catalog')
          errors.push(`${unit.id}: source catalog coverage is incomplete`)
      }
    for (const climb of unit.climbs) {
      state(climb.id, climb.contentState)
      if (
        climb.sourceIdentity?.identityStatus === 'unresolved' &&
        climb.contentState?.status !== 'blocked-identity' &&
        climb.contentState?.status !== 'excluded'
      )
        errors.push(
          `${climb.id}: unresolved source identity requires a blocked identity state`,
        )
      if (
        climb.contentState?.confidence === 'field-verified' &&
        (climb.status !== 'field-verified' || !climb.review?.reviewer?.trim())
      )
        errors.push(
          `${climb.id}: catalog field confidence requires reviewed field climb`,
        )
      if (
        climb.contentState?.status === 'complete' &&
        (climb.boulderAssignmentStatus !== 'source-backed' ||
          climb.faceAssignmentStatus !== 'source-backed' ||
          !climb.faceIds.length ||
          climb.faceIds.some(
            id =>
              !climb.geometry.some(
                geometry =>
                  geometry.faceId === id && geometry.status === 'authored',
              ),
          ))
      )
        errors.push(
          `${climb.id}: complete catalog route requires reviewed physical faces and geometry`,
        )
      if (
        unit.unitKind &&
        unit.unitKind !== 'physical-boulder' &&
        climb.geometry.some(geometry => geometry.status === 'authored')
      )
        errors.push(
          `${climb.id}: authored geometry requires an identified physical boulder`,
        )
      for (const observation of climb.parentObservations ?? []) {
        source(`${climb.id} parent`, observation.sourceId)
        source(`${climb.id} parent`, observation.parentSourceId)
        if (observation.parentUnitId && !units.has(observation.parentUnitId))
          errors.push(
            `${climb.id}: unknown parent catalog ${observation.parentUnitId}`,
          )
        if (!observation.note.trim())
          errors.push(`${climb.id}: source parent qualification missing`)
        if (
          observation.identityStatus === 'unresolved' &&
          climb.contentState?.status !== 'blocked-identity' &&
          climb.contentState?.status !== 'excluded'
        )
          errors.push(
            `${climb.id}: unresolved source parent requires a blocked identity state`,
          )
      }
      for (const observation of climb.routeFacts?.observations ?? []) {
        source(`${climb.id} facts`, observation.sourceId)
        if (!climb.sourceIds.includes(observation.sourceId))
          errors.push(
            `${climb.id}: factual observation source is not attached to route`,
          )
        if (
          observation.publisher === 'OpenBeta' &&
          observation.sourceDependency === 'primary-source-page'
        )
          errors.push(
            `${climb.id}: imported or unresolved OpenBeta facts cannot claim primary MP evidence`,
          )
        if (
          observation.publisher === 'Mountain Project' &&
          observation.sourceDependency !== 'primary-source-page'
        )
          errors.push(
            `${climb.id}: Mountain Project facts require their primary source dependency`,
          )
        if (
          Object.values(observation.sectionAvailability).every(
            value => value === 'absent',
          ) &&
          Object.values(observation.facts).some(facts => facts.length)
        )
          errors.push(
            `${climb.id}: absent source sections cannot supply route facts`,
          )
      }
    }
  }
  return errors
}
