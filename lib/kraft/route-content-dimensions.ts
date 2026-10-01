import type {
  RouteContentDimensions,
  TopoEvidence,
} from './route-content-types'
import {
  validAuthoredGeometry,
  validSpecificPathReview,
} from './route-topo-geometry.ts'
import type { Climb, Face } from './types'

type DimensionFace = Face & {
  image: Face['image'] & { representation?: 'photograph' | 'reconstruction' }
}

function normalizeGrade(grade: string): string {
  return grade.trim().toUpperCase().replaceAll(/[–—−]/g, '-')
}

function gradeDimension(climb: Climb): RouteContentDimensions['grade'] {
  const observations = climb.gradeObservations.filter(
    observation => observation.identityStatus === 'source-linked',
  )
  const selected = observations.find(
    observation =>
      observation.sourceId === climb.selectedGradeSourceId &&
      normalizeGrade(observation.grade) === normalizeGrade(climb.grade),
  )
  if (!selected) return 'unknown'
  for (const system of ['V', 'Font', 'YDS']) {
    const grades = new Set(
      observations
        .filter(observation => observation.system === system)
        .map(observation => normalizeGrade(observation.grade)),
    )
    if (grades.size > 1) return 'disputed'
  }
  return 'verified'
}

function parentDimension(climb: Climb): RouteContentDimensions['parent'] {
  const parents = climb.parentObservations ?? []
  const first = parents[0]?.parentUnitId
  if (
    !first ||
    parents.some(
      parent =>
        parent.identityStatus === 'source-linked' &&
        parent.parentUnitId !== first,
    )
  )
    return 'disputed'
  return 'verified'
}

function faceDimension(
  climb: Climb,
  faces: DimensionFace[],
): RouteContentDimensions['face'] {
  const assigned = faces.filter(face => climb.faceIds.includes(face.id))
  if (!assigned.length || assigned.length !== climb.faceIds.length)
    return 'unknown'
  return climb.faceAssignmentStatus === 'source-backed' &&
    assigned.every(face => face.groupingStatus === 'source-backed')
    ? 'known'
    : 'provisional'
}

function topoEvidence(
  climb: Climb,
  dimensions: Omit<RouteContentDimensions, 'topo' | 'image'>,
  faces: DimensionFace[],
): TopoEvidence {
  const facts = climb.routeFacts
  const sourceIds = [
    ...new Set([
      ...(facts?.observations
        .filter(
          observation =>
            observation.sourceDependency !== 'correlated-mp-import',
        )
        .map(observation => observation.sourceId) ?? []),
      ...climb.geometry
        .filter(geometry => geometry.status === 'authored')
        .flatMap(geometry => geometry.sourceIds),
      ...faces
        .filter(face => climb.faceIds.includes(face.id))
        .flatMap(face => face.sourceIds)
        .filter(sourceId => climb.sourceIds.includes(sourceId)),
    ]),
  ]
  const physicalParentConflict =
    climb.sourceIdentity?.mpId &&
    climb.boulderAssignmentStatus === 'editorial-provisional'
  if (
    dimensions.identity === 'disputed' ||
    dimensions.parent === 'disputed' ||
    physicalParentConflict
  )
    return {
      confidenceLevel: 'unresolved',
      drawingPolicy: 'no-draw',
      sourceIds,
      reasons: [
        'An explicit source-parent or physical membership conflict remains. Retain the route and its factual observations; do not draw a line on the disputed parent.',
      ],
    }
  if (
    dimensions.face === 'known' &&
    (facts?.start.length ?? 0) > 0 &&
    (facts?.path.length ?? 0) > 0 &&
    (facts?.finish.length ?? 0) > 0 &&
    (validSpecificPathReview(climb, climb.routePathReview) ||
      climb.geometry.some(
        geometry =>
          geometry.status === 'authored' &&
          validSpecificPathReview(climb, geometry.routePathReview),
      ))
  )
    return {
      confidenceLevel: 'high',
      drawingPolicy: 'reviewed-line',
      sourceIds,
      reasons: [
        'A named, dated review explicitly covers this specific route path and its source evidence. Authoring an SVG or dating it does not by itself establish high confidence.',
      ],
    }
  const hasPath = (facts?.path.length ?? 0) > 0
  const hasBoundary =
    (facts?.start.length ?? 0) > 0 && (facts?.finish.length ?? 0) > 0
  const featureText = [
    ...(facts?.start ?? []),
    ...(facts?.path ?? []),
    ...(facts?.finish ?? []),
  ].join(' ')
  const hasRegion =
    (facts?.face.length ?? 0) > 0 ||
    dimensions.face !== 'unknown' ||
    /\b(?:ledge|rail|crack|slab|ar[eê]te|roof|lip|hueco|pocket|jug|crimp|edge|flake|seam|corner|overhang|fin|scoop|ramp|dihedral|shelf|platform|hole|squeeze|chimney|cave)(?:s|es)?\b/i.test(
      featureText,
    ) ||
    /\b(?:left|leftward|right|rightward|up|upward|down|downward|straight|traverse|across|diagonal|direct|around)\b/i.test(
      facts?.path.join(' ') ?? '',
    )
  if (hasPath && hasBoundary && hasRegion)
    return {
      confidenceLevel: 'moderate',
      drawingPolicy:
        dimensions.face === 'unknown' ? 'no-draw' : 'general-corridor',
      sourceIds,
      reasons: [
        'Source observations describe a start, a path, a finish and a feature/region. Exact holds are not required for general corridor evidence.',
        dimensions.face === 'unknown'
          ? 'No face is assigned yet; the evidence is retained without drawing photo pixels.'
          : 'A conceptual corridor can be supported by these facts; no photo pixels or exact route artwork are authored by this classification.',
      ],
    }
  if (dimensions.face !== 'unknown')
    return {
      confidenceLevel: 'face-only',
      drawingPolicy: 'face-only',
      sourceIds,
      reasons: [
        'A face is assigned from source evidence, but path and boundary evidence are insufficient for a route corridor. No line is inferred.',
      ],
    }
  return {
    confidenceLevel: 'unresolved',
    drawingPolicy: 'no-draw',
    sourceIds,
    reasons: [
      (facts?.face.length ?? 0) > 0
        ? 'Source face or region clues are retained; no registered face assignment or drawable corridor is established.'
        : 'The route remains available in the catalog. Its source observations do not establish a face or drawable corridor.',
    ],
  }
}

export function deriveRouteContent(
  climb: Climb,
  faces: DimensionFace[],
): {
  contentDimensions: RouteContentDimensions
  topoEvidence: TopoEvidence
} {
  const dimensions = {
    identity:
      climb.sourceIdentity?.mpId || climb.sourceIdentity?.openBetaIds.length
        ? 'verified'
        : 'disputed',
    grade: gradeDimension(climb),
    parent: parentDimension(climb),
    face: faceDimension(climb, faces),
  } satisfies Omit<RouteContentDimensions, 'topo' | 'image'>
  const evidence = topoEvidence(climb, dimensions, faces)
  const authored = validAuthoredGeometry(climb, faces)
  const reviewed = authored.some(
    geometry =>
      geometry.confidenceLevel === 'high' &&
      validSpecificPathReview(
        climb,
        geometry.routePathReview ?? climb.routePathReview,
      ) &&
      (geometry.routePathReview ?? climb.routePathReview)?.reviewedSvgPath ===
        geometry.path,
  )
  const corridor =
    dimensions.face === 'known' &&
    evidence.drawingPolicy !== 'no-draw' &&
    authored.some(geometry => geometry.confidenceLevel === 'moderate') &&
    (evidence.confidenceLevel === 'moderate' ||
      evidence.confidenceLevel === 'high')
  const assigned = faces.filter(face => climb.faceIds.includes(face.id))
  const available = assigned.filter(face => face.image.status === 'available')
  return {
    contentDimensions: {
      ...dimensions,
      topo:
        reviewed && evidence.confidenceLevel === 'high'
          ? 'reviewed'
          : corridor
            ? 'corridor'
            : 'unavailable',
      image: available.some(
        face => face.image.representation !== 'reconstruction',
      )
        ? 'available'
        : available.length
          ? 'reconstruction'
          : 'missing',
    },
    topoEvidence: evidence,
  }
}
