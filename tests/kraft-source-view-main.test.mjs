import assert from 'node:assert/strict'
import test from 'node:test'
import { kraftGuide } from '../lib/kraft/data.ts'
import { deriveRouteContent } from '../lib/kraft/route-content-dimensions.ts'
import { applySourceViewAssignments } from '../lib/kraft/source-view-assignments.ts'
import { validateGuide } from '../lib/kraft/validate.ts'
import { visibleExistingCorridorFaces } from '../lib/kraft/visible-existing-corridors.ts'

const expectedViews = [
  {
    parent: '105959400',
    id: 'mp-view-105959400-potato-chips-relative-region',
    orientation: 'unknown',
    assignment: 'editorial-provisional',
    routes: [
      '106650925',
      '106650919',
      '113679909',
      '116680131',
      '114236573',
      '106650933',
      '108439752',
      '118057327',
    ],
  },
  {
    parent: '106657477',
    id: 'mp-view-106657477-main-south',
    orientation: 'south',
    assignment: 'source-backed',
    routes: ['106657480'],
  },
  {
    parent: '106657477',
    id: 'mp-view-106657477-main-southwest',
    orientation: 'southwest',
    assignment: 'source-backed',
    routes: ['107430241', '107396283'],
  },
  {
    parent: '106657477',
    id: 'mp-view-106657477-fluffer-donkey-relative-region',
    orientation: 'unknown',
    assignment: 'editorial-provisional',
    routes: ['107116919', '107432448', '122054608', '125574115'],
  },
]
const routeIds = new Set(expectedViews.flatMap(view => view.routes))
const donkeyFace = visibleExistingCorridorFaces.find(
  face => face.mpParentId === '106657477',
)
const donkeyCorridor = donkeyFace.corridors.find(
  corridor => corridor.mpRouteId === '107396283',
)
const assignmentKeys = new Set([
  'faceIds',
  'faceAssignmentStatus',
  'geometry',
  'sourceIds',
  'contentState',
  'contentDimensions',
  'topoEvidence',
])

function originalDetails(climb) {
  return Object.fromEntries(
    Object.entries(climb).filter(([key]) => !assignmentKeys.has(key)),
  )
}

function batchClimbs(guide) {
  return guide.boulders.flatMap(unit =>
    unit.climbs.filter(climb => routeIds.has(climb.sourceIdentity.mpId)),
  )
}

test('the main batch retains 15 exact routes in four qualified views with scoped Warm-up imagery', () => {
  assert.equal(batchClimbs(kraftGuide).length, 15)
  for (const expected of expectedViews) {
    const unit = kraftGuide.boulders.find(
      item => item.sourceIdentity.mpId === expected.parent,
    )
    const face = unit.faces.find(item => item.id === expected.id)
    assert.ok(face, expected.id)
    assert.equal(face.orientation, expected.orientation)
    assert.equal(face.groupingStatus, expected.assignment)
    const hasContextImage = expected.parent === '106657477'
    assert.equal(face.image.status, hasContextImage ? 'available' : 'missing')
    assert.equal(face.review, undefined)
    assert.deepEqual(
      face.sourceViewObservations.map(item => item.mpRouteId).sort(),
      [...expected.routes].sort(),
    )
    for (const routeId of expected.routes) {
      const climb = unit.climbs.find(
        item => item.sourceIdentity.mpId === routeId,
      )
      assert.deepEqual(climb.faceIds, [expected.id])
      assert.ok(face.climbIds.includes(climb.id))
      assert.equal(climb.faceAssignmentStatus, expected.assignment)
      assert.equal(
        climb.contentDimensions.face,
        expected.assignment === 'source-backed' ? 'known' : 'provisional',
      )
      assert.equal(climb.contentDimensions.parent, 'verified')
      assert.equal(
        climb.contentDimensions.image,
        hasContextImage ? 'reconstruction' : 'missing',
      )
      const hasCorridor = routeId === donkeyCorridor.mpRouteId
      assert.equal(
        climb.contentDimensions.topo,
        hasCorridor ? 'corridor' : 'unavailable',
      )
      assert.equal(
        climb.contentState.status,
        hasCorridor
          ? 'partial'
          : hasContextImage
            ? 'blocked-evidence'
            : 'blocked-lawful-image',
      )
      if (hasCorridor) {
        assert.equal(expected.id, donkeyFace.faceId)
        assert.equal(climb.geometry.length, 1)
        assert.equal(climb.geometry[0].status, 'authored')
        assert.equal(climb.geometry[0].path, donkeyCorridor.path)
        assert.deepEqual(climb.geometry[0].labelPoint, donkeyCorridor.entry)
        assert.equal(climb.geometry[0].confidenceLevel, 'moderate')
        assert.equal(climb.topoEvidence.drawingPolicy, 'general-corridor')
      } else assert.ok(climb.geometry.every(item => item.status === 'missing'))
    }
  }
  const units = kraftGuide.boulders.filter(unit =>
    ['105959400', '106657477'].includes(unit.sourceIdentity.mpId),
  )
  for (const climb of units.flatMap(unit => unit.climbs)) {
    if (routeIds.has(climb.sourceIdentity.mpId)) continue
    assert.deepEqual(climb.faceIds, [], climb.id)
    assert.equal(climb.contentDimensions.face, 'unknown')
  }
  const native = units
    .flatMap(unit => unit.climbs)
    .find(climb => !climb.sourceIdentity.mpId && climb.name === 'Rub One Off')
  assert.ok(native)
  assert.equal(native.contentState.status, 'blocked-identity')
  assert.equal(native.sourceIdentity.identityStatus, 'unresolved')
})

test('relative routes retain unknown compass bearings and bounded continuation uncertainty', () => {
  const potato = kraftGuide.boulders.find(
    unit => unit.sourceIdentity.mpId === '105959400',
  )
  const relative = potato.faces[0]
  assert.equal(relative.orientation, 'unknown')
  assert.equal(relative.orientationStatus, 'unknown')
  for (const observation of relative.sourceViewObservations)
    assert.equal(observation.orientation, 'unknown')
  const continuation = relative.sourceViewObservations.find(
    observation => observation.mpRouteId === '106650933',
  )
  assert.match(continuation.note, /continuations can extend beyond this view/)
  assert.ok(
    continuation.relationEvidence.some(
      evidence =>
        evidence.mpRouteId === '106650933' &&
        evidence.sourceFact ===
          'Continue until a step-off is possible on the other side.',
    ),
  )
  const warm = kraftGuide.boulders.find(
    unit => unit.sourceIdentity.mpId === '106657477',
  )
  const warmRelative = warm.faces.find(face =>
    face.id.endsWith('fluffer-donkey-relative-region'),
  )
  assert.equal(warmRelative.orientation, 'unknown')
  for (const observation of warmRelative.sourceViewObservations) {
    assert.equal(observation.orientation, 'unknown')
    assert.deepEqual(
      observation.relationEvidence.map(evidence => evidence.mpRouteId),
      ['106657480', '107396283'],
    )
  }
  assert.ok(
    warm.climbs
      .find(climb => climb.sourceIdentity.mpId === '122054608')
      .routeFacts.unresolved.some(note => note.includes('naming/listing')),
  )
  assert.ok(
    potato.climbs
      .find(climb => climb.sourceIdentity.mpId === '108731193')
      .routeFacts.unresolved.some(note => note.includes('naming relationship')),
  )
})

test('fresh application preserves original facts, grades, identities, risks and parents and is idempotent', () => {
  const guide = structuredClone(kraftGuide)
  const before = batchClimbs(guide).map(climb => originalDetails(climb))
  for (const unit of guide.boulders) {
    unit.faces = unit.faces.filter(
      face => !expectedViews.some(view => view.id === face.id),
    )
    for (const climb of unit.climbs)
      if (routeIds.has(climb.sourceIdentity.mpId)) {
        climb.faceIds = []
        climb.faceAssignmentStatus = 'unassigned'
        climb.geometry = []
      }
  }
  applySourceViewAssignments(guide.boulders)
  for (const unit of guide.boulders)
    for (const climb of unit.climbs)
      Object.assign(climb, deriveRouteContent(climb, unit.faces))
  assert.deepEqual(batchClimbs(guide).map(originalDetails), before)
  assert.deepEqual(validateGuide(guide), [])
  const applied = structuredClone(guide)
  applySourceViewAssignments(guide.boulders)
  assert.deepEqual(guide, applied)
})

test('exact identity, primary facts and matching parents remain required on reapplication', () => {
  for (const change of [
    climb => {
      climb.sourceIdentity.mpId = 'different-route-id'
    },
    climb => {
      climb.sourceIdentity.identityStatus = 'unresolved'
    },
    climb => {
      climb.routeFacts.observations[0].facts.face = ['South side guessed.']
    },
    climb => {
      climb.routeFacts.observations[0].sourceDependency = 'correlated-mp-import'
    },
    climb => {
      climb.parentObservations[0].identityStatus = 'unresolved'
    },
    climb => {
      climb.parentObservations[0].parentSourceId = 'different-source-parent'
    },
    climb => {
      climb.parentObservations.push({
        ...climb.parentObservations[0],
        parentUnitId: 'conflicting-source-parent',
        sourceDependency: 'correlated-mp-import',
      })
    },
  ]) {
    const guide = structuredClone(kraftGuide)
    const unit = guide.boulders.find(
      item => item.sourceIdentity.mpId === '106657477',
    )
    const climb = unit.climbs.find(
      item => item.sourceIdentity.mpId === '106657480',
    )
    change(climb)
    assert.throws(
      () => applySourceViewAssignments(guide.boulders),
      /exact route-parent facts 106657480/,
    )
  }
})
