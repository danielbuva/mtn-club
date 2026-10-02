import assert from 'node:assert/strict'
import test from 'node:test'
import { kraftGuide } from '../lib/kraft/data.ts'
import { applySourceViewAssignments } from '../lib/kraft/source-view-assignments.ts'

const expectedRouteIds = [
  '124045669',
  '124045709',
  '111470042',
  '124045533',
  '121616668',
  '116693657',
  '107849034',
  '114126068',
  '108731189',
  '114126042',
  '108731202',
  '121742287',
  '125073927',
  '107430220',
  '107430226',
  '112868532',
  '125074020',
  '113801775',
  '107430198',
  '107430210',
  '107430204',
  '107430182',
  '119981210',
  '125195801',
  '120119682',
  '110174761',
  '110174781',
  '110174755',
  '110174619',
  '106799344',
  '125499203',
  '120588286',
  '120588308',
  '120588296',
  '200739087',
  '126830908',
  '110224293',
  '107430960',
  '125692296',
  '200632114',
]
const provisionalRouteIds = new Set([
  '114126068',
  '108731189',
  '114126042',
  '108731202',
  '121742287',
])
const views = kraftGuide.boulders.flatMap(unit =>
  unit.faces
    .filter(face => face.sourceViewObservations?.length)
    .map(face => ({ unit, face })),
)
const records = views.flatMap(({ unit, face }) =>
  face.sourceViewObservations.map(observation => ({ unit, face, observation })),
)
const sources = new Map(kraftGuide.sources.map(source => [source.id, source]))

function assertExactEvidence(unit, face, climb, evidence) {
  const owner = unit.climbs.find(
    item => item.sourceIdentity.mpId === evidence.mpRouteId,
  )
  assert.ok(owner, evidence.mpRouteId)
  const primary = owner.routeFacts.observations.find(
    item => item.sourceId === evidence.sourceId,
  )
  assert.ok(primary, evidence.sourceId)
  assert.equal(primary.publisher, 'Mountain Project')
  assert.equal(primary.sourceDependency, 'primary-source-page')
  assert.equal(primary.retrievedAt, evidence.retrievedAt)
  assert.ok(primary.facts[evidence.factField].includes(evidence.sourceFact))
  assert.ok(
    sources
      .get(evidence.sourceId)
      .url.includes(`/route/${evidence.mpRouteId}/`),
  )
  assert.ok(face.sourceIds.includes(evidence.sourceId))
  assert.ok(climb.sourceIds.includes(evidence.sourceId))
  assert.ok(climb.topoEvidence.sourceIds.includes(evidence.sourceId))
}

test('the actual source-view batch retains exactly 40 routes in 21 qualified views', () => {
  assert.equal(views.length, 21)
  assert.equal(records.length, 40)
  assert.equal(new Set(records.map(row => row.observation.mpRouteId)).size, 40)
  assert.deepEqual(
    records.map(row => row.observation.mpRouteId).sort(),
    [...expectedRouteIds].sort(),
  )
  const cube = views.find(({ face }) => face.id === 'cube-east')
  assert.equal(cube.face.orientation, 'east')
  assert.deepEqual(
    cube.face.sourceViewObservations.map(item => item.mpRouteId).sort(),
    [
      '124045669',
      '124045709',
      '111470042',
      '124045533',
      '121616668',
      '116693657',
    ].sort(),
  )
  for (const { unit, face, observation } of records) {
    const climb = unit.climbs.find(
      item => item.sourceIdentity.mpId === observation.mpRouteId,
    )
    const provisional = provisionalRouteIds.has(observation.mpRouteId)
    const assignment = provisional ? 'editorial-provisional' : 'source-backed'
    assert.equal(unit.sourceIdentity.mpId, observation.mpParentId)
    assert.equal(observation.scope, 'source-catalog-view')
    assert.equal(face.orientation, observation.orientation)
    assert.equal(
      face.orientationStatus,
      observation.orientation === 'unknown' ? 'unknown' : 'source-observation',
    )
    assert.equal(face.groupingStatus, assignment)
    assert.equal(climb.faceAssignmentStatus, assignment)
    assert.equal(
      climb.contentDimensions.face,
      provisional ? 'provisional' : 'known',
    )
    assert.ok(face.climbIds.includes(climb.id))
    assert.deepEqual(climb.faceIds, [face.id])
    assertExactEvidence(unit, face, climb, observation)
    for (const related of observation.relationEvidence)
      assertExactEvidence(unit, face, climb, related)
    assert.ok(climb.parentObservations.length)
    for (const parent of climb.parentObservations)
      if (parent.identityStatus === 'source-linked')
        assert.equal(parent.parentUnitId, unit.id)
    assert.equal(climb.contentDimensions.parent, 'verified')
    assert.equal(climb.status, 'source-observation')
    assert.equal(face.image.status, 'missing')
    assert.equal(face.review, undefined)
    assert.equal(climb.contentDimensions.image, 'missing')
    assert.equal(climb.contentDimensions.topo, 'unavailable')
    assert.notEqual(climb.topoEvidence.confidenceLevel, 'high')
    assert.deepEqual(
      climb.geometry.map(({ status, faceId }) => ({ status, faceId })),
      [{ status: 'missing', faceId: face.id }],
    )
    assert.ok(climb.geometry[0].reason.trim())
    assert.ok(face.photographNote.includes(observation.sourceFact))
    assert.ok(face.photographNote.includes(observation.sourceId))
    assert.match(observation.note, /source-qualified catalog view/)
  }
})

test('relative Monkey regions and Black Warm-up rear views preserve compass and parent uncertainty', () => {
  for (const { unit, face, observation } of records) {
    if (provisionalRouteIds.has(observation.mpRouteId)) {
      assert.equal(face.orientation, 'unknown')
      assert.equal(face.groupingStatus, 'editorial-provisional')
      assert.equal(observation.relationEvidence.length, 2)
    }
    if (['123856651', '123856648'].includes(observation.mpParentId)) {
      assert.equal(face.orientation, 'unknown')
      assert.equal(unit.unitKind, 'source-unit')
      const climb = unit.climbs.find(
        item => item.sourceIdentity.mpId === observation.mpRouteId,
      )
      const unresolvedParent = climb.parentObservations.find(
        parent => parent.identityStatus === 'unresolved',
      )
      if (unresolvedParent) {
        assert.equal(unresolvedParent.sourceDependency, 'correlated-mp-import')
        assert.match(
          unresolvedParent.note,
          /differs from, or has no exact link/,
        )
        assert.equal(climb.contentState.status, 'blocked-identity')
        assert.equal(climb.contentState.confidence, 'identity-unresolved')
      }
    }
  }
})

test('source-view application preserves existing records and rejects drift in exact facts or parents', () => {
  const unchanged = structuredClone(kraftGuide)
  applySourceViewAssignments(unchanged.boulders)
  assert.deepEqual(unchanged, kraftGuide)
  for (const change of [
    climb => {
      climb.routeFacts.observations[0].facts.face = ['Guessed east face.']
    },
    climb => {
      climb.parentObservations[0].parentUnitId = 'different-source-unit'
    },
  ]) {
    const guide = structuredClone(kraftGuide)
    const cube = guide.boulders.find(unit => unit.id === 'cube')
    const marriage = cube.climbs.find(climb => climb.id === 'cube-marriage')
    change(marriage)
    assert.throws(
      () => applySourceViewAssignments(guide.boulders),
      /exact route-parent facts 124045669/,
    )
  }
})
