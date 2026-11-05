import type { RouteAnnotations } from '@/lib/kraft/route-annotation-types'
import {
  startAnnotationAnchor,
  startAnnotationPoints,
} from '@/lib/kraft/route-annotations'

type Clearance = { left: number; top: number; right: number; bottom: number }
type MarkerRoute = {
  geometry: { labelPoint: { x: number; y: number } }
  annotations?: RouteAnnotations
}

/** Overlapping holes must merge: even-odd SVG clipping would reopen overlaps. */
function mergedClearances(clearances: Clearance[]): Clearance[] {
  const merged: Clearance[] = []
  for (const clearance of clearances) {
    let next = clearance
    let index = 0
    while (index < merged.length) {
      const other = merged[index]
      if (
        next.left <= other.right &&
        next.right >= other.left &&
        next.top <= other.bottom &&
        next.bottom >= other.top
      ) {
        next = {
          left: Math.min(next.left, other.left),
          top: Math.min(next.top, other.top),
          right: Math.max(next.right, other.right),
          bottom: Math.max(next.bottom, other.bottom),
        }
        merged.splice(index, 1)
        index = 0
      } else index += 1
    }
    merged.push(next)
  }
  return merged
}

/** Only invisible touch targets use this clearance; rock and thin lines remain visible. */
export function topoMarkerClearancePath(
  routes: MarkerRoute[],
  size: number,
): string {
  const clearances: Clearance[] = []
  function protect(x: number, y: number, radiusX: number, radiusY = radiusX) {
    clearances.push({
      left: x - radiusX,
      top: y - radiusY,
      right: x + radiusX,
      bottom: y + radiusY,
    })
  }
  for (const { geometry, annotations } of routes) {
    const start = annotations?.start
    if (start && start.placement.status !== 'unlocated') {
      const anchor = startAnnotationAnchor(start, geometry.labelPoint)
      protect(
        anchor.x,
        anchor.y - size * 1.1,
        size * (start.kind === 'required-plus-other' ? 3.5 : 2.5),
        size * 0.85,
      )
      for (const point of startAnnotationPoints(start))
        protect(point.x, point.y, size * 1.35 + 3)
    }
    const movement = annotations?.movement
    if (movement?.placement.status === 'reviewed') {
      const { start, target, staticPath } = movement.placement
      for (const point of [start, target])
        protect(point.x, point.y, size * 0.4 + 3)
      protect(
        (start.x + target.x) / 2 + size * 1.1,
        (start.y + target.y) / 2 - size * 0.3,
        size,
        size * 0.55,
      )
      if (staticPath)
        protect(
          staticPath[0].x + size * 1.25,
          staticPath[0].y + size * 0.55,
          size,
          size * 0.55,
        )
    }
  }
  return mergedClearances(clearances)
    .map(
      ({ left, top, right, bottom }) =>
        `M${left} ${top}H${right}V${bottom}H${left}Z`,
    )
    .join(' ')
}
