import type { RouteAnnotations } from './route-annotation-types'
import {
  type AnnotationContext,
  validateRouteAnnotations,
} from './route-annotations.ts'

/** One invalid placement cannot hide a different valid start or movement rule. */
export function validRouteAnnotations(
  annotations: RouteAnnotations | undefined,
  context: AnnotationContext,
): RouteAnnotations | undefined {
  if (!annotations) return undefined
  const start =
    annotations.start &&
    validateRouteAnnotations({ start: annotations.start }, context).length === 0
      ? annotations.start
      : undefined
  const movement =
    annotations.movement &&
    validateRouteAnnotations({ movement: annotations.movement }, context)
      .length === 0
      ? annotations.movement
      : undefined
  return start || movement ? { start, movement } : undefined
}

/** Preserve source rules independently of missing, partial or stale image placement. */
export function resolveRouteAnnotations(
  documented: RouteAnnotations | undefined,
  placed: RouteAnnotations | undefined,
  context: AnnotationContext,
): RouteAnnotations | undefined {
  const validPlaced = validRouteAnnotations(placed, context)
  const validDocumented = validRouteAnnotations(documented, context)
  let start = validPlaced?.start ?? validDocumented?.start
  let movement = validPlaced?.movement ?? validDocumented?.movement
  const unlocated = {
    status: 'unlocated',
    reason: 'Position on this image awaits review.',
  } as const
  if (!start) {
    for (const candidate of [placed?.start, documented?.start]) {
      if (!candidate) continue
      const sourceOnly = { ...candidate, placement: unlocated }
      if (
        validateRouteAnnotations({ start: sourceOnly }, context).length === 0
      ) {
        start = sourceOnly
        break
      }
    }
  }
  if (!movement) {
    for (const candidate of [placed?.movement, documented?.movement]) {
      if (!candidate) continue
      const sourceOnly = { ...candidate, placement: unlocated }
      if (
        validateRouteAnnotations({ movement: sourceOnly }, context).length === 0
      ) {
        movement = sourceOnly
        break
      }
    }
  }
  return start || movement ? { start, movement } : undefined
}
