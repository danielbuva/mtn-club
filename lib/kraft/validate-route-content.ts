import { deriveRouteContent } from './route-content-dimensions.ts'
import { validSpecificPathReview } from './route-topo-geometry.ts'
import type {
  KraftGuide,
  RouteContentDimensions,
  TopoPathReview,
} from './types'

const allowed = {
  identity: ['verified', 'disputed'],
  grade: ['verified', 'disputed', 'unknown'],
  parent: ['verified', 'disputed'],
  face: ['known', 'provisional', 'unknown'],
  topo: ['reviewed', 'corridor', 'unavailable'],
  image: ['available', 'reconstruction', 'missing'],
}
const dimensionKeys: (keyof RouteContentDimensions)[] = [
  'identity',
  'grade',
  'parent',
  'face',
  'topo',
  'image',
]

/** Source checks and topology checks never remove a route from the runtime. */
export function validateRouteContent(guide: KraftGuide): string[] {
  const errors: string[] = []
  const sources = new Set(guide.sources.map(source => source.id))
  for (const unit of guide.boulders) {
    for (const face of unit.faces)
      if (
        face.image.status === 'available' &&
        face.image.representation !== undefined &&
        !['photograph', 'reconstruction'].includes(face.image.representation)
      )
        errors.push(`${face.id}: invalid image representation`)
    for (const climb of unit.climbs) {
      const dimensions = climb.contentDimensions
      const evidence = climb.topoEvidence
      if ((!dimensions || !evidence) && guide.status === 'catalog')
        errors.push(
          `${climb.id}: independent route content dimensions and topo evidence missing`,
        )
      const expected = deriveRouteContent(climb, unit.faces)
      if (dimensions)
        for (const key of dimensionKeys) {
          if (!(key in dimensions)) {
            errors.push(`${climb.id}: route content dimension ${key} missing`)
            continue
          }
          const value = dimensions[key]
          if (typeof value !== 'string' || !allowed[key].includes(value))
            errors.push(`${climb.id}: invalid route content dimension ${key}`)
          else if (value !== expected.contentDimensions[key])
            errors.push(
              `${climb.id}: ${key} dimension contradicts qualified source or geometry evidence`,
            )
        }
      if (evidence) {
        if (
          !['high', 'moderate', 'face-only', 'unresolved'].includes(
            evidence.confidenceLevel,
          )
        )
          errors.push(`${climb.id}: invalid topo confidence level`)
        if (
          ![
            'reviewed-line',
            'general-corridor',
            'face-only',
            'no-draw',
          ].includes(evidence.drawingPolicy)
        )
          errors.push(`${climb.id}: invalid topo drawing policy`)
        if (
          evidence.confidenceLevel !== expected.topoEvidence.confidenceLevel ||
          evidence.drawingPolicy !== expected.topoEvidence.drawingPolicy
        )
          errors.push(
            `${climb.id}: topo evidence class contradicts specific route facts or review`,
          )
        if (
          !Array.isArray(evidence.reasons) ||
          !evidence.reasons.length ||
          evidence.reasons.some(
            reason => typeof reason !== 'string' || !reason.trim(),
          )
        )
          errors.push(`${climb.id}: topo evidence qualification missing`)
        if (!Array.isArray(evidence.sourceIds))
          errors.push(`${climb.id}: topo evidence source list missing`)
        for (const id of evidence.sourceIds ?? [])
          if (!sources.has(id) || !climb.sourceIds.includes(id))
            errors.push(
              `${climb.id}: topo evidence source is unknown or unattached ${id}`,
            )
      }
      function review(value: TopoPathReview | undefined) {
        if (value && !validSpecificPathReview(climb, value))
          errors.push(
            `${climb.id}: specific route-path review lacks dated named source corroboration`,
          )
      }
      review(climb.routePathReview)
      for (const geometry of climb.geometry) {
        if (geometry.status !== 'authored') continue
        if (
          guide.status === 'catalog' &&
          (climb.parentObservations?.[0]?.parentUnitId !== unit.id ||
            deriveRouteContent({ ...climb, geometry: [geometry] }, unit.faces)
              .contentDimensions.topo === 'unavailable')
        )
          errors.push(
            `${climb.id}: authored catalog geometry requires a checked own-source parent, identified face/image, sufficient route facts and valid supported SVG`,
          )
        if (
          geometry.confidenceLevel !== undefined &&
          !['high', 'moderate'].includes(geometry.confidenceLevel)
        )
          errors.push(`${climb.id}: invalid authored geometry confidence level`)
        review(geometry.routePathReview)
        if (
          geometry.confidenceLevel === 'high' &&
          (!validSpecificPathReview(
            climb,
            geometry.routePathReview ?? climb.routePathReview,
          ) ||
            (geometry.routePathReview ?? climb.routePathReview)
              ?.reviewedSvgPath !== geometry.path)
        )
          errors.push(
            `${climb.id}: high geometry confidence requires a review of this exact SVG path`,
          )
      }
    }
  }
  return errors
}
