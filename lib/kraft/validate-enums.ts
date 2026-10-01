import type { KraftGuide } from './types'

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
  check(guide.id, 'guide status', guide.status, [
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
    check(
      boulder.id,
      'area assignment status',
      boulder.areaAssignmentStatus,
      physical,
    )
    check(
      boulder.id,
      'location evidence status',
      boulder.location.status,
      evidence,
    )
    if (boulder.coverage)
      check(boulder.id, 'coverage status', boulder.coverage.status, [
        'partial',
        'source-catalog',
      ])
    for (const observation of boulder.location.observations ?? []) {
      check(
        boulder.id,
        'coordinate evidence status',
        observation.status,
        evidence,
      )
      check(boulder.id, 'coordinate selection', observation.selection, [
        'selected',
        'rejected',
        'comparison',
      ])
    }
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
