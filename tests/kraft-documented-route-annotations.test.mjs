import assert from 'node:assert/strict'
import test from 'node:test'
import { kraftGuide } from '../lib/kraft/data.ts'
import { applyDocumentedRouteAnnotations } from '../lib/kraft/documented-route-annotations.ts'
import {
  routeAnnotationSummaries,
  validateRouteAnnotations,
} from '../lib/kraft/route-annotations.ts'

const routes = boulders => boulders.flatMap(unit => unit.climbs)

function freshCatalog() {
  const boulders = structuredClone(kraftGuide.boulders)
  for (const climb of routes(boulders)) delete climb.routeAnnotations
  return boulders
}

function climbByMp(boulders, mpRouteId) {
  const climb = routes(boulders).find(
    item => item.sourceIdentity?.mpId === mpRouteId,
  )
  assert.ok(climb, `Missing exact MP route ${mpRouteId}`)
  return climb
}

function unitFor(boulders, climb) {
  const unit = boulders.find(item => item.climbs.includes(climb))
  assert.ok(unit, `Missing catalog membership for ${climb.id}`)
  return unit
}

function primaryObservation(climb) {
  const observation = climb.routeFacts.observations.find(
    item =>
      item.publisher === 'Mountain Project' &&
      item.sourceDependency === 'primary-source-page',
  )
  assert.ok(observation, `Missing primary facts for ${climb.id}`)
  return observation
}

function assertSkipped(summary, mpRouteId) {
  const skipped = summary.skipped.find(item => item.mpRouteId === mpRouteId)
  assert.ok(skipped, `No skip recorded for ${mpRouteId}`)
  assert.ok(skipped.reason.length > 0)
}

test('documented annotations preserve every visible route and all original catalog evidence', () => {
  const boulders = freshCatalog()
  const original = structuredClone(boulders)
  const summary = applyDocumentedRouteAnnotations(boulders)
  const climbs = routes(boulders)
  assert.equal(climbs.length, 383)
  assert.equal(new Set(climbs.map(climb => climb.id)).size, 383)
  assert.equal(summary.startAnnotations, 97)
  assert.equal(summary.movementAnnotations, 2)
  for (const climb of climbs) {
    if (!climb.routeAnnotations) continue
    assert.deepEqual(
      validateRouteAnnotations(climb.routeAnnotations, {
        sourceIds: climb.sourceIds,
      }),
      [],
      climb.id,
    )
    for (const annotation of Object.values(climb.routeAnnotations)) {
      assert.equal(annotation.placement.status, 'unlocated')
      assert.deepEqual(Object.keys(annotation.placement).sort(), [
        'reason',
        'status',
      ])
      assert.deepEqual(annotation.sourceIds, [
        primaryObservation(climb).sourceId,
      ])
      assert.equal(annotation.reportedAt, undefined)
      assert.equal(annotation.review.reviewedAt, '2026-10-01')
      assert.ok(
        annotation.review.description.includes(
          primaryObservation(climb).retrievedAt,
        ),
      )
    }
  }
  const withoutAnnotations = structuredClone(boulders)
  for (const climb of routes(withoutAnnotations)) delete climb.routeAnnotations
  assert.deepEqual(withoutAnnotations, original)
})

test('source start semantics keep matches, separate holds, features and omitted hands distinct', () => {
  const boulders = freshCatalog()
  applyDocumentedRouteAnnotations(boulders)
  for (const [id, kind] of [
    ['126854481', 'matched-hands'],
    ['118153704', 'two-required-holds'],
    ['122054559', 'two-hands-on-feature'],
    ['126016220', 'required-plus-other'],
    ['106056281', 'two-required-holds'],
    ['106652010', 'two-hands-on-feature'],
  ]) {
    assert.equal(climbByMp(boulders, id).routeAnnotations.start.kind, kind, id)
  }
  const omitted = climbByMp(boulders, '126016220').routeAnnotations.start
  assert.equal(omitted.otherHandRule, 'not-described')
  assert.match(
    routeAnnotationSummaries({ start: omitted }).join(' '),
    /other hand not described/i,
  )
  const low = climbByMp(boulders, '125074020').routeAnnotations.start
  assert.equal(low.kind, 'hands-low')
  assert.match(low.rule, /low/i)
  assert.doesNotMatch(
    routeAnnotationSummaries({ start: low }).join(' '),
    /\b(?:sit|seated|matched)\b/i,
  )
  const jenna = climbByMp(boulders, '106652010')
  assert.deepEqual(jenna.routeAnnotations.start.sourceIds, ['mp-jennas'])
  assert.equal(
    climbByMp(boulders, '107444907').routeAnnotations.start.kind,
    'seated-hands-low',
  )
})

test('only current primary same-climb alternatives receive movement annotations', () => {
  const boulders = freshCatalog()
  applyDocumentedRouteAnnotations(boulders)
  const movements = routes(boulders).filter(
    climb => climb.routeAnnotations?.movement,
  )
  assert.deepEqual(movements.map(climb => climb.sourceIdentity.mpId).sort(), [
    '106652010',
    '106800770',
  ])
  assert.deepEqual(
    climbByMp(boulders, '106652010').routeAnnotations.movement.sourceIds,
    ['mp-jennas'],
  )
  for (const id of ['106056281', '107444907', '114000113', '106732641'])
    assert.equal(
      climbByMp(boulders, id).routeAnnotations?.movement,
      undefined,
      id,
    )
})

test('source start, acquisition timestamp and source identity drift skip normalization', () => {
  for (const mutate of [
    climb => {
      primaryObservation(climb).facts.start.push(
        'Unreviewed additional start rule.',
      )
    },
    climb => {
      primaryObservation(climb).retrievedAt = '2026-10-02T00:00:00.000Z'
    },
    climb => {
      primaryObservation(climb).sourceId = 'another-route-source'
    },
    climb => {
      primaryObservation(climb).sourceDependency = 'correlated-mp-import'
    },
    climb => {
      climb.sourceIds = climb.sourceIds.filter(
        id => id !== primaryObservation(climb).sourceId,
      )
    },
  ]) {
    const boulders = freshCatalog()
    const climb = climbByMp(boulders, '126854481')
    mutate(climb)
    const summary = applyDocumentedRouteAnnotations(boulders)
    assertSkipped(summary, '126854481')
    assert.equal(climb.routeAnnotations?.start, undefined)
    assert.equal(routes(boulders).length, 383)
  }
})

test('a movement fact change cannot borrow a valid alternative from the original climb', () => {
  for (const field of ['path', 'constraints']) {
    const boulders = freshCatalog()
    const climb = climbByMp(boulders, '106800770')
    primaryObservation(climb).facts[field].push(
      'Unreviewed movement alternative.',
    )
    const summary = applyDocumentedRouteAnnotations(boulders)
    assertSkipped(summary, '106800770')
    assert.equal(climb.routeAnnotations?.movement, undefined)
  }
})

test('wrong or conflicting source parents keep routes visible without promoting their rules', () => {
  for (const mutate of [
    (_climb, unit) => {
      unit.sourceIdentity.mpId = 'wrong-mp-parent'
    },
    climb => {
      climb.parentObservations[0].parentSourceId = 'mp-area-wrong-parent'
    },
    climb => {
      climb.sourceIdentity.identityStatus = 'unresolved'
    },
    (_climb, unit) => {
      unit.contentState.status = 'blocked-identity'
    },
    (climb, unit) => {
      const linked = climb.parentObservations.find(
        item => item.sourceDependency === 'correlated-mp-import',
      )
      assert.ok(linked)
      linked.parentUnitId = `${unit.id}-conflicting-parent`
    },
  ]) {
    const boulders = freshCatalog()
    const climb = climbByMp(boulders, '118153704')
    mutate(climb, unitFor(boulders, climb))
    const summary = applyDocumentedRouteAnnotations(boulders)
    assertSkipped(summary, '118153704')
    assert.equal(climb.routeAnnotations?.start, undefined)
    assert.equal(routes(boulders).length, 383)
  }
})

test('names do not bind rules and duplicate exact MP identities remain ambiguous', () => {
  const renamed = freshCatalog()
  const exact = climbByMp(renamed, '126854481')
  exact.name = 'Renamed control with the same exact source identity'
  applyDocumentedRouteAnnotations(renamed)
  assert.equal(exact.routeAnnotations.start.kind, 'matched-hands')
  const unlinked = routes(renamed).find(climb => !climb.sourceIdentity.mpId)
  assert.ok(unlinked)
  unlinked.name = exact.name
  applyDocumentedRouteAnnotations(renamed)
  assert.equal(unlinked.routeAnnotations, undefined)

  const duplicated = freshCatalog()
  const first = climbByMp(duplicated, '126854481')
  const second = structuredClone(first)
  second.id = `${first.id}-ambiguous-control`
  unitFor(duplicated, first).climbs.push(second)
  const summary = applyDocumentedRouteAnnotations(duplicated)
  assertSkipped(summary, '126854481')
  assert.equal(first.routeAnnotations, undefined)
  assert.equal(second.routeAnnotations, undefined)
  assert.equal(routes(duplicated).length, 384)
})

test('composite starts, fallen problems and imported discrepancies remain unresolved evidence', () => {
  const boulders = freshCatalog()
  const original = structuredClone(boulders)
  applyDocumentedRouteAnnotations(boulders)
  for (const id of [
    '125230717',
    '113679909',
    '120588302',
    '123326041',
    '121616668',
    '125419031',
    '125601778',
  ])
    assert.equal(climbByMp(boulders, id).routeAnnotations?.start, undefined, id)
  for (const id of ['106056281', '107432448', '121725135', '106799344'])
    assert.deepEqual(
      climbByMp(boulders, id).routeFacts,
      climbByMp(original, id).routeFacts,
      id,
    )
})

test('replaying normalized rules is idempotent and retains existing manual annotations', () => {
  const boulders = freshCatalog()
  applyDocumentedRouteAnnotations(boulders)
  const manual = climbByMp(boulders, '106652010').routeAnnotations
  manual.start.rule =
    'Synthetic manual start review control, retained without replacement.'
  manual.movement.rule =
    'Synthetic manual movement review control, retained without replacement.'
  const annotated = structuredClone(boulders)
  const replay = applyDocumentedRouteAnnotations(boulders)
  assert.equal(replay.startAnnotations, 0)
  assert.equal(replay.movementAnnotations, 0)
  assert.deepEqual(boulders, annotated)
})
