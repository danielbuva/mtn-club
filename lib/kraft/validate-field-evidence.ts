import type { KraftGuide } from './types'

/** A field claim requires review evidence even when the edition remains a pilot. */
export function validateFieldEvidence(guide: KraftGuide): string[] {
  const errors: string[] = []
  for (const boulder of guide.boulders) {
    const location = boulder.location
    const selected =
      location?.observations?.filter(
        observation => observation.selection === 'selected',
      ) ?? []
    if (selected.some(observation => observation.status !== location?.status))
      errors.push(
        `${boulder.id}: location status contradicts selected coordinate evidence`,
      )
    for (const observation of [
      ...(location?.observations ?? []),
      ...(boulder.coordinateObservations ?? []),
    ]) {
      if (observation.status !== 'field-verified') continue
      if (
        !observation.review?.reviewer?.trim() ||
        !Number.isFinite(observation.review?.accuracyMeters) ||
        (observation.review?.accuracyMeters ?? -1) < 0
      )
        errors.push(
          `${boulder.id}: field coordinate observation requires its own named review and measured uncertainty`,
        )
      if (
        observation.selection === 'selected' &&
        (observation.review?.reviewer !== location?.review?.reviewer ||
          observation.review?.reviewedAt !== location?.review?.reviewedAt ||
          observation.review?.accuracyMeters !==
            location?.review?.accuracyMeters)
      )
        errors.push(
          `${boulder.id}: plotted field review contradicts selected coordinate review`,
        )
    }
    if (
      location?.status === 'field-verified' &&
      (!location.review?.reviewer?.trim() ||
        !Number.isFinite(location.review?.accuracyMeters) ||
        (location.review?.accuracyMeters ?? -1) < 0 ||
        selected.length !== 1 ||
        selected[0]?.status !== 'field-verified')
    )
      errors.push(
        `${boulder.id}: field location requires named review and measured uncertainty`,
      )
    for (const face of boulder.faces)
      if (
        face.orientationStatus === 'field-verified' &&
        (!face.review?.reviewer?.trim() ||
          face.groupingStatus !== 'source-backed')
      )
        errors.push(
          `${face.id}: field orientation requires named review and physical grouping`,
        )
    for (const climb of boulder.climbs) {
      for (const observation of climb.coordinateObservations ?? [])
        if (
          observation.status === 'field-verified' &&
          (!observation.review?.reviewer?.trim() ||
            !Number.isFinite(observation.review?.accuracyMeters) ||
            (observation.review?.accuracyMeters ?? -1) < 0 ||
            climb.status !== 'field-verified' ||
            !climb.review?.reviewer?.trim())
        )
          errors.push(
            `${climb.id}: field coordinate observation requires reviewed physical climb and measured uncertainty`,
          )
      if (
        climb.status === 'field-verified' &&
        (!climb.review?.reviewer?.trim() ||
          climb.betaStatus !== 'source-synopsis' ||
          climb.boulderAssignmentStatus !== 'source-backed' ||
          climb.faceAssignmentStatus !== 'source-backed' ||
          !climb.faceIds.length)
      )
        errors.push(
          `${climb.id}: field climb requires named review and resolved physical assignment`,
        )
      for (const observation of [
        ...climb.gradeObservations,
        ...(climb.conditionObservations ?? []),
      ])
        if (
          observation.status === 'field-verified' &&
          (climb.status !== 'field-verified' ||
            !climb.review?.reviewer?.trim() ||
            observation.identityStatus !== 'source-linked')
        )
          errors.push(
            `${climb.id}: field observation requires a reviewed field climb and resolved identity`,
          )
    }
  }
  return errors
}
