import type {
  ContentState,
  CoordinateObservation,
  KraftGuide,
  SourceIdentity,
} from './types'

const evidence = ['source-observation', 'field-verified']
const identity = ['source-linked', 'unresolved']
const physical = ['source-backed', 'editorial-provisional']

/** Required runtime qualifiers must fail closed even when a JSON field is missing. */
export function validateGuideEnums(guide: KraftGuide): string[] {
  const errors: string[] = []
  function check(
    owner: string,
    label: string,
    value: unknown,
    allowed: string[],
  ) {
    if (typeof value !== 'string' || !allowed.includes(value))
      errors.push(`${owner}: invalid or missing ${label}`)
  }
  function state(owner: string, value: ContentState | undefined) {
    if (!value) return
    check(owner, 'catalog content status', value.status, [
      'partial',
      'blocked-lawful-image',
      'blocked-identity',
      'blocked-evidence',
      'excluded',
      'complete',
    ])
    check(owner, 'catalog content confidence', value.confidence, [
      ...evidence,
      'identity-unresolved',
    ])
  }
  function sourceIdentity(owner: string, value: SourceIdentity | undefined) {
    if (!value) return
    check(owner, 'source identity status', value.identityStatus, identity)
    if (
      value.mpId !== null &&
      (typeof value.mpId !== 'string' || !/^\d+$/.test(value.mpId))
    )
      errors.push(`${owner}: invalid MP numeric source identity`)
    if (
      !Array.isArray(value.openBetaIds) ||
      value.openBetaIds.some(
        id =>
          typeof id !== 'string' ||
          !/^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/.test(id),
      )
    )
      errors.push(`${owner}: invalid OpenBeta source identity`)
  }
  function coordinates(owner: string, observations: CoordinateObservation[]) {
    for (const observation of observations) {
      check(owner, 'coordinate evidence status', observation.status, evidence)
      check(owner, 'coordinate selection', observation.selection, [
        'selected',
        'rejected',
        'comparison',
      ])
    }
  }
  const dependencies = [
    'primary-source-page',
    'correlated-mp-import',
    'origin-unresolved',
  ]
  check(guide.id, 'guide status', guide.status, [
    'catalog',
    'content-pilot',
    'field-guide',
  ])
  for (const source of guide.sources)
    check(source.id, 'source usage', source.usage, [
      'factual-reference',
      'open-data',
      'licensed-media',
    ])
  for (const asset of guide.assets)
    check(asset.id, 'asset kind', asset.kind, ['map', 'face-photo'])
  for (const boulder of guide.boulders) {
    state(boulder.id, boulder.contentState)
    sourceIdentity(boulder.id, boulder.sourceIdentity)
    if (boulder.unitKind !== undefined || guide.status === 'catalog')
      check(boulder.id, 'catalog unit kind', boulder.unitKind, [
        'physical-boulder',
        'source-unit',
        'unresolved-unit',
      ])
    check(
      boulder.id,
      'area assignment status',
      boulder.areaAssignmentStatus,
      physical,
    )
    if (boulder.location)
      check(
        boulder.id,
        'location evidence status',
        boulder.location.status,
        evidence,
      )
    if (boulder.location?.scope !== undefined)
      check(boulder.id, 'location scope', boulder.location.scope, [
        'boulder-point',
        'catalog-centroid',
      ])
    if (boulder.coverage)
      check(boulder.id, 'coverage status', boulder.coverage.status, [
        'partial',
        'source-catalog',
      ])
    coordinates(boulder.id, boulder.location?.observations ?? [])
    coordinates(boulder.id, boulder.coordinateObservations ?? [])
    for (const alias of boulder.aliasObservations ?? [])
      check(boulder.id, 'alias identity status', alias.identityStatus, identity)
    for (const face of boulder.faces) {
      check(face.id, 'face orientation status', face.orientationStatus, [
        ...evidence,
        'unknown',
      ])
      check(face.id, 'face grouping status', face.groupingStatus, physical)
      check(face.id, 'face image status', face.image.status, [
        'available',
        'missing',
      ])
    }
    for (const climb of boulder.climbs) {
      state(climb.id, climb.contentState)
      sourceIdentity(climb.id, climb.sourceIdentity)
      coordinates(climb.id, climb.coordinateObservations ?? [])
      for (const observation of climb.parentObservations ?? []) {
        check(
          climb.id,
          'parent identity status',
          observation.identityStatus,
          identity,
        )
        check(
          climb.id,
          'parent source dependency',
          observation.sourceDependency,
          dependencies,
        )
      }
      for (const observation of climb.routeFacts?.observations ?? []) {
        check(climb.id, 'fact publisher', observation.publisher, [
          'Mountain Project',
          'OpenBeta',
        ])
        check(
          climb.id,
          'fact source dependency',
          observation.sourceDependency,
          dependencies,
        )
        check(
          climb.id,
          'fact description availability',
          observation.sectionAvailability.description,
          ['present', 'absent'],
        )
        check(
          climb.id,
          'fact location availability',
          observation.sectionAvailability.location,
          ['present', 'absent'],
        )
      }
      check(climb.id, 'climb evidence status', climb.status, evidence)
      check(climb.id, 'beta status', climb.betaStatus, [
        'source-synopsis',
        'catalog-only',
      ])
      check(
        climb.id,
        'physical boulder assignment status',
        climb.boulderAssignmentStatus,
        physical,
      )
      check(climb.id, 'face assignment status', climb.faceAssignmentStatus, [
        ...physical,
        'unassigned',
      ])
      for (const observation of climb.gradeObservations) {
        if (observation.sourceDependency !== undefined)
          check(
            climb.id,
            'grade source dependency',
            observation.sourceDependency,
            dependencies,
          )
        check(climb.id, 'grade system', observation.system, [
          'V',
          'Font',
          'YDS',
        ])
        check(climb.id, 'grade evidence status', observation.status, evidence)
        check(
          climb.id,
          'grade identity status',
          observation.identityStatus,
          identity,
        )
      }
      for (const observation of climb.conditionObservations ?? []) {
        check(
          climb.id,
          'condition evidence status',
          observation.status,
          evidence,
        )
        check(
          climb.id,
          'condition identity status',
          observation.identityStatus,
          identity,
        )
      }
      for (const alias of climb.aliases ?? [])
        check(climb.id, 'alias identity status', alias.identityStatus, identity)
      for (const geometry of climb.geometry)
        check(climb.id, 'route geometry status', geometry.status, [
          'authored',
          'missing',
        ])
    }
  }
  return errors
}
