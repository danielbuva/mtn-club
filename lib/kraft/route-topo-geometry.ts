import type { TopoPathReview } from './route-content-types'
import { isDrawableSvgPath } from './route-svg-path.ts'
import type { Climb, Face, RouteGeometry } from './types'
import { isEvidenceDate } from './validate-dates.ts'

type AuthoredGeometry = Extract<RouteGeometry, { status: 'authored' }>

/** An authored object alone is not evidence of a valid drawable SVG. */
export function validAuthoredGeometry(
  climb: Climb,
  faces: Face[],
): AuthoredGeometry[] {
  const today = new Date().toISOString().slice(0, 10)
  const sources = new Set([
    ...climb.sourceIds,
    ...faces.flatMap(face => face.sourceIds),
  ])
  return climb.geometry.filter((geometry): geometry is AuthoredGeometry => {
    if (geometry.status !== 'authored') return false
    const face = faces.find(item => item.id === geometry.faceId)
    return (
      climb.faceIds.includes(geometry.faceId) &&
      face?.image.status === 'available' &&
      typeof geometry.path === 'string' &&
      isDrawableSvgPath(geometry.path) &&
      Number.isFinite(geometry.labelPoint?.x) &&
      Number.isFinite(geometry.labelPoint?.y) &&
      geometry.labelPoint.x >= 0 &&
      geometry.labelPoint.x <= face.image.width &&
      geometry.labelPoint.y >= 0 &&
      geometry.labelPoint.y <= face.image.height &&
      isEvidenceDate(geometry.reviewedAt, today) &&
      Array.isArray(geometry.sourceIds) &&
      geometry.sourceIds.length > 0 &&
      geometry.sourceIds.every(id => sources.has(id))
    )
  })
}

/** High source confidence requires an explicit specific-path review. */
export function validSpecificPathReview(
  climb: Climb,
  review: TopoPathReview | undefined,
): boolean {
  if (
    !review ||
    review.scope !== 'specific-route-path' ||
    typeof review.reviewer !== 'string' ||
    !review.reviewer.trim() ||
    typeof review.description !== 'string' ||
    !review.description.trim() ||
    !isEvidenceDate(review.reviewedAt, new Date().toISOString().slice(0, 10))
  )
    return false
  const pathSources = new Set(
    climb.routeFacts?.observations
      .filter(
        observation =>
          observation.facts.path.length > 0 &&
          observation.sourceDependency !== 'correlated-mp-import',
      )
      .map(observation => observation.sourceId) ?? [],
  )
  if (
    !Array.isArray(review.sourceIds) ||
    !review.sourceIds.length ||
    !review.sourceIds.every(id => pathSources.has(id))
  )
    return false
  return (
    review.method === 'critic-route-path-review' ||
    (review.method === 'independent-source-corroboration' &&
      new Set(review.sourceIds).size >= 2)
  )
}
