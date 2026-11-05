import type {
  AnnotationReview,
  DocumentedAnnotation,
  NativeTopoPoint,
  RouteAnnotations,
  TopoMovementAnnotation,
  TopoStartAnnotation,
} from './route-annotation-types'
import { isEvidenceDate } from './validate-dates.ts'

export type AnnotationContext = {
  sourceIds: readonly string[]
  image?: { assetId: string; width: number; height: number }
  /** Publication uses the guide review date; rendering stays deterministic. */
  reviewedBefore?: string
}

function validReview(review: AnnotationReview, today: string): boolean {
  return (
    Boolean(review?.reviewer?.trim() && review.description?.trim()) &&
    isEvidenceDate(review.reviewedAt, today)
  )
}

function validPoint(
  point: NativeTopoPoint,
  image: { width: number; height: number },
): boolean {
  return (
    Number.isFinite(point?.x) &&
    Number.isFinite(point?.y) &&
    point.x >= 0 &&
    point.x <= image.width &&
    point.y >= 0 &&
    point.y <= image.height
  )
}

export function startAnnotationPoints(
  start: TopoStartAnnotation,
): NativeTopoPoint[] {
  if (start.placement.status === 'reviewed-region')
    return [start.placement.region]
  switch (start.kind) {
    case 'start-zone':
      return []
    case 'matched-hands':
      return start.placement.status === 'reviewed' ? [start.placement.hold] : []
    case 'two-required-holds':
      return start.placement.status === 'reviewed'
        ? [...start.placement.holds]
        : []
    case 'required-plus-other':
      return start.placement.status === 'reviewed'
        ? [
            start.placement.requiredHold,
            ...(start.placement.otherHandRegion
              ? [start.placement.otherHandRegion]
              : []),
          ]
        : []
    case 'seated-hands-low':
    case 'hands-low':
      return start.placement.status === 'reviewed'
        ? [start.placement.region, ...(start.placement.hands ?? [])]
        : []
    case 'two-hands-on-feature':
      return start.placement.status === 'reviewed'
        ? [start.placement.feature]
        : []
  }
}

/** Label layout may use a midpoint without claiming it is another hold. */
export function startAnnotationAnchor(
  start: TopoStartAnnotation,
  fallback: NativeTopoPoint,
): NativeTopoPoint {
  const points = startAnnotationPoints(start)
  if (points.length === 0) return fallback
  if (start.kind === 'two-required-holds' && points[1])
    return {
      x: (points[0].x + points[1].x) / 2,
      y: (points[0].y + points[1].y) / 2,
    }
  return points[0]
}

function annotationErrors(
  annotation: (TopoStartAnnotation | TopoMovementAnnotation) &
    DocumentedAnnotation,
  points: NativeTopoPoint[],
  context: AnnotationContext,
): string[] {
  const errors: string[] = []
  const today = context.reviewedBefore ?? annotation.review?.reviewedAt ?? ''
  if (!annotation.rule?.trim())
    errors.push('Documented annotation rule missing')
  if (
    !Array.isArray(annotation.sourceIds) ||
    annotation.sourceIds.length === 0 ||
    !annotation.sourceIds.every(id => context.sourceIds.includes(id))
  )
    errors.push('Annotation must cite known sources for this climb')
  if (!validReview(annotation.review, today))
    errors.push('Documented annotation review missing or invalid')
  if (
    annotation.reportedAt !== undefined &&
    !isEvidenceDate(annotation.reportedAt, today)
  )
    errors.push('Documented annotation source date invalid')
  const placement = annotation.placement
  if (placement.status === 'unlocated') {
    if (!placement.reason?.trim())
      errors.push('Unlocated annotation reason missing')
    return errors
  }
  const image = context.image
  if (
    !['reviewed', 'reviewed-region'].includes(placement.status) ||
    !image ||
    placement.image?.assetId !== image.assetId ||
    placement.image.width !== image.width ||
    placement.image.height !== image.height ||
    !Number.isFinite(image.width) ||
    !Number.isFinite(image.height) ||
    image.width <= 0 ||
    image.height <= 0
  )
    errors.push(
      'Annotation placement must reference the displayed native image',
    )
  if (!validReview(placement.review, today))
    errors.push('Annotation placement review missing or invalid')
  if (
    !['source-landmark-correspondence', 'field-verified'].includes(
      placement.method,
    ) ||
    !['region', 'hold'].includes(placement.precision)
  )
    errors.push(
      'Annotation placement requires an explicit method and precision',
    )
  if (!image || points.some(point => !validPoint(point, image)))
    errors.push('Annotation point lies outside the native image')
  return errors
}

/** Publication and rendering use the same evidence and native-space checks. */
export function validateRouteAnnotations(
  annotations: RouteAnnotations,
  context: AnnotationContext,
): string[] {
  const errors: string[] = []
  if (annotations.start) {
    const start = annotations.start
    if (
      ![
        'matched-hands',
        'two-required-holds',
        'required-plus-other',
        'seated-hands-low',
        'hands-low',
        'two-hands-on-feature',
        'start-zone',
      ].includes(start.kind)
    )
      return ['Unsupported documented start kind']
    errors.push(
      ...annotationErrors(start, startAnnotationPoints(start), context),
    )
    if (
      start.kind === 'required-plus-other' &&
      !['unspecified', 'lower', 'not-described'].includes(start.otherHandRule)
    )
      errors.push('Other-hand freedom must be explicitly documented')
    if (
      start.kind === 'required-plus-other' &&
      start.otherHandRule === 'not-described' &&
      start.placement.status === 'reviewed' &&
      start.placement.otherHandRegion
    )
      errors.push('An undescribed other hand cannot receive a plotted position')
    if (
      start.kind === 'two-hands-on-feature' &&
      start.placement.status === 'reviewed' &&
      start.placement.precision !== 'region'
    )
      errors.push(
        'A shared starting feature does not identify individual holds',
      )
    if (
      start.kind === 'two-required-holds' &&
      start.placement.status === 'reviewed'
    ) {
      const [first, second] = start.placement.holds
      if (!first || !second || (first.x === second.x && first.y === second.y))
        errors.push('Two required holds need two distinct reviewed positions')
    }
    if (
      (start.kind === 'seated-hands-low' || start.kind === 'hands-low') &&
      start.placement.status === 'reviewed' &&
      start.placement.hands
    ) {
      const [first, second] = start.placement.hands
      if (!first || !second || (first.x === second.x && first.y === second.y))
        errors.push('Two hand regions need two distinct reviewed positions')
    }
  }
  if (annotations.movement) {
    const movement = annotations.movement
    if (movement.kind !== 'dyno-with-static-alternative')
      return ['Unsupported documented movement kind']
    const points =
      movement.placement.status === 'reviewed'
        ? [
            movement.placement.start,
            movement.placement.target,
            ...(movement.placement.staticPath ?? []),
          ]
        : []
    errors.push(...annotationErrors(movement, points, context))
    if (movement.placement.status === 'reviewed') {
      const { start, target, staticPath } = movement.placement
      if (start.x === target.x && start.y === target.y)
        errors.push('Dyno start and target must be distinct')
      if (staticPath && staticPath.length < 2)
        errors.push('Static direction needs at least two reviewed positions')
    }
  }
  return errors
}

/** Source wording remains available when individual hand positions are unknown. */
export function routeAnnotationSummaries(
  annotations: RouteAnnotations,
): string[] {
  return [annotations.start, annotations.movement].flatMap(annotation => {
    if (!annotation) return []
    const qualification =
      annotation.placement.status === 'unlocated'
        ? `Image position not located: ${annotation.placement.reason}`
        : annotation.placement.status === 'reviewed-region'
          ? 'Approximate start region; hand positions are not mapped.'
          : annotation.placement.precision === 'region'
            ? 'Image position is approximate.'
            : ''
    const otherHand =
      annotation.kind === 'required-plus-other' &&
      annotation.otherHandRule === 'not-described'
        ? ' Other hand not described; no unrestricted-start claim.'
        : ''
    return [
      `${annotation.rule}${/[.!?]$/.test(annotation.rule) ? '' : '.'}${otherHand}${qualification ? ` ${qualification}` : ''}`,
    ]
  })
}
