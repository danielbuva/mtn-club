import { matchSourceFaceRule } from './source-face-assignments.ts'
import { sourceFaceRules } from './source-face-rules.ts'
import type { KraftGuide } from './types'

/** Catalog face observations require source facts, never an image/field gate. */
export function validateSourceFaces(guide: KraftGuide): string[] {
  const errors: string[] = []
  const sources = new Set(guide.sources.map(source => source.id))
  for (const unit of guide.boulders) {
    for (const face of unit.faces) {
      const observations = face.sourceFaceObservations
      if (face.id.startsWith('mp-face-') && !observations?.length)
        errors.push(`${face.id}: controlled source face observation missing`)
      const routeIds = new Set<string>()
      for (const observation of observations ?? []) {
        const rule = sourceFaceRules.find(
          candidate =>
            candidate.mpRouteId === observation.mpRouteId &&
            candidate.mpParentId === observation.mpParentId &&
            candidate.orientation === observation.orientation,
        )
        const climb = unit.climbs.find(
          item => item.sourceIdentity?.mpId === observation.mpRouteId,
        )
        const expected =
          rule && climb ? matchSourceFaceRule(unit, climb, rule) : null
        if (!expected || !climb) {
          errors.push(
            `${face.id}: source face lacks exact route-parent fact evidence`,
          )
          continue
        }
        if (routeIds.has(observation.mpRouteId))
          errors.push(`${face.id}: duplicate source face route observation`)
        routeIds.add(observation.mpRouteId)
        if (
          observation.sourceFact !== expected.sourceFact ||
          observation.sourceId !== expected.sourceId ||
          observation.retrievedAt !== expected.retrievedAt ||
          observation.scope !== 'source-catalog-face' ||
          !observation.note.trim() ||
          !sources.has(observation.sourceId) ||
          !face.sourceIds.includes(observation.sourceId)
        )
          errors.push(
            `${face.id}: source face provenance contradicts the original observation`,
          )
        if (
          face.orientation !== observation.orientation ||
          face.orientationStatus !== 'source-observation' ||
          face.groupingStatus !== 'source-backed' ||
          !face.climbIds.includes(climb.id) ||
          !climb.faceIds.includes(face.id) ||
          climb.faceAssignmentStatus !== 'source-backed'
        )
          errors.push(
            `${face.id}: source face assignment contradicts its qualified membership`,
          )
      }
      if (
        observations &&
        face.climbIds.some(
          id =>
            !observations.some(observation =>
              unit.climbs.some(
                climb =>
                  climb.id === id &&
                  climb.sourceIdentity?.mpId === observation.mpRouteId,
              ),
            ),
        )
      )
        errors.push(
          `${face.id}: source face member lacks its own exact observation`,
        )
    }
  }
  return errors
}
