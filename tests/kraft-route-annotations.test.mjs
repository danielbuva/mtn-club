import assert from 'node:assert/strict'
import test from 'node:test'
import {
  resolveRouteAnnotations,
  validRouteAnnotations,
} from '../lib/kraft/resolve-route-annotations.ts'
import {
  routeAnnotationSummaries,
  validateRouteAnnotations,
} from '../lib/kraft/route-annotations.ts'
import { validAuthoredGeometry } from '../lib/kraft/route-topo-geometry.ts'
import {
  alternativeFixtureAnnotations,
  annotationFixtureContext,
  matchedFixtureAnnotations,
  seatedFixtureAnnotations,
} from './fixtures/kraft-annotation-fixture.ts'

test('documented start rules need known climb sources and a named dated review', () => {
  assert.deepEqual(
    validateRouteAnnotations(
      matchedFixtureAnnotations,
      annotationFixtureContext,
    ),
    [],
  )
  const annotations = structuredClone(matchedFixtureAnnotations)
  annotations.start.sourceIds = []
  annotations.start.review.reviewer = ''
  const errors = validateRouteAnnotations(
    annotations,
    annotationFixtureContext,
  ).join('\n')
  assert.match(errors, /known sources/)
  assert.match(errors, /review missing or invalid/)
  annotations.start.sourceIds = ['another-route-source']
  assert.match(
    validateRouteAnnotations(annotations, annotationFixtureContext).join('\n'),
    /known sources/,
  )
})

test('native placement rejects stale assets, generated texture methods, and out-of-bounds nodes', () => {
  for (const mutate of [
    annotations => {
      annotations.movement.placement.target.y = -1
    },
    annotations => {
      annotations.movement.placement.staticPath[2].x = 1001
    },
    annotations => {
      annotations.start.placement.requiredHold.x = Number.NaN
    },
    annotations => {
      annotations.start.placement.image.assetId = 'a-previous-image'
    },
    annotations => {
      annotations.start.placement.image.width = 999
    },
    annotations => {
      annotations.start.placement.method = 'generated-microtexture'
    },
  ]) {
    const annotations = structuredClone(alternativeFixtureAnnotations)
    mutate(annotations)
    assert.ok(
      validateRouteAnnotations(annotations, annotationFixtureContext).length >
        0,
    )
  }
})

test('an unlocated start preserves its rule without silently granting other-hand freedom', () => {
  const annotations = {
    start: {
      ...matchedFixtureAnnotations.start,
      kind: 'seated-hands-low',
      rule: 'Sit start with both hands lower',
      placement: {
        status: 'unlocated',
        reason: 'The source does not identify the individual holds.',
      },
    },
  }
  assert.deepEqual(
    validateRouteAnnotations(annotations, { sourceIds: ['test-fixture'] }),
    [],
  )
  assert.match(
    routeAnnotationSummaries(annotations)[0],
    /both hands lower.*individual holds/,
  )
  assert.doesNotMatch(
    routeAnnotationSummaries(annotations)[0],
    /anywhere|unrestricted/,
  )
  annotations.start.kind = 'required-plus-other'
  assert.match(
    validateRouteAnnotations(annotations, { sourceIds: ['test-fixture'] }).join(
      '\n',
    ),
    /explicitly documented/,
  )
})

test('same-climb dyno and static placements keep one authored route and identity', () => {
  const geometry = {
    status: 'authored',
    faceId: 'synthetic-face',
    path: 'M750 640L360 85',
    labelPoint: { x: 750, y: 640 },
    sourceIds: ['test-fixture'],
    reviewedAt: '2026-09-30',
    annotations: alternativeFixtureAnnotations,
  }
  const climb = {
    id: 'one-synthetic-climb',
    faceIds: ['synthetic-face'],
    sourceIds: ['test-fixture'],
    geometry: [geometry],
  }
  const face = {
    id: 'synthetic-face',
    sourceIds: ['test-fixture'],
    image: { status: 'available', ...annotationFixtureContext.image },
  }
  assert.deepEqual(
    validateRouteAnnotations(geometry.annotations, annotationFixtureContext),
    [],
  )
  const routes = validAuthoredGeometry(climb, [face])
  assert.equal(routes.length, 1)
  assert.equal(climb.id, 'one-synthetic-climb')
  assert.equal(routes[0].annotations.movement.placement.staticPath.length, 4)
  assert.match(
    routeAnnotationSummaries(routes[0].annotations).join(' '),
    /same climb/,
  )
})

test('two source-required holds cannot be collapsed into a matched-start symbol', () => {
  const annotations = {
    start: {
      ...matchedFixtureAnnotations.start,
      kind: 'two-required-holds',
      placement: {
        ...matchedFixtureAnnotations.start.placement,
        holds: [
          { x: 200, y: 640 },
          { x: 300, y: 640 },
        ],
      },
    },
  }
  assert.deepEqual(
    validateRouteAnnotations(annotations, annotationFixtureContext),
    [],
  )
  annotations.start.placement.holds[1] = { x: 200, y: 640 }
  assert.match(
    validateRouteAnnotations(annotations, annotationFixtureContext).join('\n'),
    /distinct reviewed positions/,
  )
})

test('source omission never permits a second plotted hand node', () => {
  const annotations = structuredClone(alternativeFixtureAnnotations)
  annotations.start.otherHandRule = 'not-described'
  assert.match(
    validateRouteAnnotations(annotations, annotationFixtureContext).join('\n'),
    /undescribed other hand/,
  )
  delete annotations.start.placement.otherHandRegion
  assert.deepEqual(
    validateRouteAnnotations(annotations, annotationFixtureContext),
    [],
  )
  assert.match(
    routeAnnotationSummaries(annotations)[0],
    /Other hand not described; no unrestricted-start claim/,
  )
})

test('partial or stale placement preserves valid same-climb documentary alternatives', () => {
  const documented = structuredClone(alternativeFixtureAnnotations)
  documented.start.placement = {
    status: 'unlocated',
    reason: 'The exact hand positions are unknown.',
  }
  documented.movement.placement = {
    status: 'unlocated',
    reason: 'The movement span is not located.',
  }
  const placed = { start: structuredClone(alternativeFixtureAnnotations.start) }
  placed.start.placement.image.assetId = 'obsolete-image'
  const resolved = resolveRouteAnnotations(
    documented,
    placed,
    annotationFixtureContext,
  )
  assert.equal(resolved.start.placement.status, 'unlocated')
  assert.equal(resolved.movement.kind, 'dyno-with-static-alternative')
  assert.match(routeAnnotationSummaries(resolved).join(' '), /same climb/)
  const validMovement = structuredClone(alternativeFixtureAnnotations)
  validMovement.start.placement.image = {
    ...validMovement.start.placement.image,
    assetId: 'obsolete-image',
  }
  const valid = validRouteAnnotations(validMovement, annotationFixtureContext)
  assert.equal(valid.start, undefined)
  assert.equal(valid.movement.placement.status, 'reviewed')
})

test('reviewed start regions locate an entry without inventing required hand positions', () => {
  const annotations = {
    start: {
      ...matchedFixtureAnnotations.start,
      kind: 'two-required-holds',
      rule: 'Start with each hand on its documented required hold',
      placement: {
        ...matchedFixtureAnnotations.start.placement,
        status: 'reviewed-region',
        precision: 'region',
        region: { x: 260, y: 640 },
      },
    },
  }
  delete annotations.start.placement.hold
  assert.deepEqual(
    validateRouteAnnotations(annotations, annotationFixtureContext),
    [],
  )
  assert.equal('holds' in annotations.start.placement, false)
  assert.match(
    routeAnnotationSummaries(annotations)[0],
    /Approximate start region; hand positions are not mapped/,
  )
  annotations.start.placement.region.x = -1
  assert.match(
    validateRouteAnnotations(annotations, annotationFixtureContext).join('\n'),
    /outside the native image/,
  )
})

test('reviewed seated starts can show two separately authored approximate hand regions', () => {
  assert.deepEqual(
    validateRouteAnnotations(
      seatedFixtureAnnotations,
      annotationFixtureContext,
    ),
    [],
  )
  assert.equal(seatedFixtureAnnotations.start.placement.precision, 'region')
  assert.deepEqual(seatedFixtureAnnotations.start.placement.handOrder, [
    'left',
    'right',
  ])
  const invalid = structuredClone(seatedFixtureAnnotations)
  invalid.start.placement.hands[1] = { ...invalid.start.placement.hands[0] }
  assert.match(
    validateRouteAnnotations(invalid, annotationFixtureContext).join('\n'),
    /distinct reviewed positions/,
  )
})
