import type { KraftGuide } from './types'

/** A release label needs reviewed physical beta and a usable legal topo for every route. */
export function validateFieldGuideRelease(guide: KraftGuide): string[] {
  if (guide.status !== 'field-guide') return []
  const errors: string[] = []
  if (!guide.boulders.length)
    errors.push(
      'field-guide release requires physical boulders and reviewed routes',
    )
  for (const boulder of guide.boulders) {
    if (boulder.unitKind && boulder.unitKind !== 'physical-boulder')
      errors.push(
        `${boulder.id}: field-guide release requires identified physical boulders`,
      )
    if (
      boulder.location?.status !== 'field-verified' ||
      boulder.location?.scope === 'catalog-centroid' ||
      !boulder.location?.review?.reviewer?.trim() ||
      !boulder.location?.review?.reviewedAt?.trim() ||
      !Number.isFinite(boulder.location?.review?.accuracyMeters) ||
      (boulder.location?.review?.accuracyMeters ?? -1) < 0 ||
      !boulder.location?.observations?.some(
        observation =>
          observation.selection === 'selected' &&
          observation.status === 'field-verified',
      )
    )
      errors.push(
        `${boulder.id}: field-guide release requires reviewed field GPS with measured uncertainty`,
      )
    if (!boulder.climbs.length)
      errors.push(`${boulder.id}: field-guide release requires reviewed routes`)
    for (const face of boulder.faces) {
      if (
        face.image.status !== 'available' ||
        face.orientationStatus !== 'field-verified' ||
        face.groupingStatus !== 'source-backed' ||
        !face.review?.reviewer?.trim() ||
        !face.review?.reviewedAt?.trim()
      )
        errors.push(
          `${face.id}: field-guide release requires a reviewed legal face photograph`,
        )
    }
    for (const climb of boulder.climbs) {
      if (
        climb.betaStatus !== 'source-synopsis' ||
        climb.status !== 'field-verified' ||
        climb.boulderAssignmentStatus !== 'source-backed' ||
        climb.faceAssignmentStatus !== 'source-backed' ||
        !climb.faceIds.length ||
        !climb.review?.reviewer?.trim() ||
        !climb.review?.reviewedAt?.trim()
      )
        errors.push(
          `${climb.id}: field-guide release requires reviewed physical membership, beta and face assignment`,
        )
      for (const faceId of climb.faceIds)
        if (
          !climb.geometry.some(
            geometry =>
              geometry.faceId === faceId &&
              geometry.status === 'authored' &&
              geometry.reviewedAt.trim(),
          )
        )
          errors.push(
            `${climb.id}: field-guide release requires reviewed authored geometry on ${faceId}`,
          )
    }
  }
  return errors
}
