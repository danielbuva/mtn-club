import assert from 'node:assert/strict'
import test from 'node:test'
import { kraftGuide } from '../lib/kraft/data.ts'
import { pilotBoulders } from '../lib/kraft/pilot-boulders.ts'
import {
  explicitFaceOrientation,
  matchSourceFaceRule,
  sourceFaceLedger,
} from '../lib/kraft/source-face-assignments.ts'
import { sourceFaceRules } from '../lib/kraft/source-face-rules.ts'
import { validateGuide } from '../lib/kraft/validate.ts'
import { validateSourceFaces } from '../lib/kraft/validate-source-faces.ts'

const ledger = sourceFaceLedger(kraftGuide.boulders)
const byMp = new Map(
  kraftGuide.boulders.flatMap(unit =>
    unit.climbs.map(climb => [climb.sourceIdentity.mpId, { unit, climb }]),
  ),
)

test('controlled face batch spans all five clusters without changing runtime inclusion', () => {
  assert.equal(ledger.length, 64)
  assert.equal(new Set(ledger.map(row => row.mpRouteId)).size, 64)
  assert.equal(new Set(ledger.map(row => row.faceId)).size, 44)
  assert.equal(new Set(ledger.map(row => row.unitId)).size, 27)
  assert.deepEqual(
    Object.fromEntries(
      Object.entries(Object.groupBy(ledger, row => row.clusterId)).map(
        ([key, rows]) => [key, rows.length],
      ),
    ),
    {
      'west-cluster': 10,
      'cube-area': 1,
      'main-area': 34,
      'pearl-area': 1,
      'east-cluster': 18,
    },
  )
  assert.equal(kraftGuide.boulders.flatMap(unit => unit.climbs).length, 383)
  assert.deepEqual(validateGuide(kraftGuide), [])
})

test('every face assignment exposes exact source-parent facts and dated source scope', () => {
  for (const row of ledger) {
    const { unit, climb } = byMp.get(row.mpRouteId)
    const face = unit.faces.find(item => item.id === row.faceId)
    const source = kraftGuide.sources.find(item => item.id === row.sourceId)
    const observation = climb.routeFacts.observations.find(
      item => item.sourceId === row.sourceId,
    )
    assert.ok(source.url.includes(`/route/${row.mpRouteId}/`), row.mpRouteId)
    assert.equal(unit.sourceIdentity.mpId, row.mpParentId)
    assert.ok(observation.facts.face.includes(row.sourceFact))
    assert.equal(observation.retrievedAt, row.retrievedAt)
    assert.equal(observation.sourceDependency, 'primary-source-page')
    assert.equal(row.scope, 'source-catalog-face')
    assert.equal(explicitFaceOrientation(row.sourceFact), row.orientation)
    assert.equal(climb.contentDimensions.face, 'known')
    assert.equal(climb.contentDimensions.topo, 'unavailable')
    assert.equal(climb.contentDimensions.image, 'missing')
    assert.equal(face.orientationStatus, 'source-observation')
    assert.equal(face.image.status, 'missing')
    assert.equal(face.review, undefined)
    assert.ok(climb.geometry.every(item => item.status === 'missing'))
    assert.ok(climb.topoEvidence.sourceIds.includes(row.sourceId))
  }
})

test('pilot faces, IDs, reciprocal memberships and image provenance remain exact', () => {
  for (const pilot of pilotBoulders) {
    const unit = kraftGuide.boulders.find(item => item.id === pilot.id)
    assert.deepEqual(unit.faces, pilot.faces)
    for (const climb of pilot.climbs) {
      const current = unit.climbs.find(item => item.id === climb.id)
      assert.deepEqual(current.faceIds, climb.faceIds)
      assert.deepEqual(current.geometry, climb.geometry)
    }
  }
})

test('neighbor, relative, historical, grouped and conflicted facts do not acquire faces', () => {
  for (const id of [
    '125206063', // Low Rider: adjacent rock's south-facing line.
    '123478404', // Halfpipe: east is relative location from The Prowler.
    '122003753', // Wayward Left: detached rock below a northwest reference.
    '122003762', // Wayward main: cardinal describes another sloper rail.
    '200247732', // One Legged: uphill/right relative placement only.
    '125601778', // Bipartisan: historical aspect after reported rock movement.
    '119981258', // Caramel: south-arête to east-face wrap, not a single view.
  ]) {
    assert.deepEqual(byMp.get(id).climb.faceIds, [], id)
    assert.ok(!ledger.some(row => row.mpRouteId === id), id)
  }
  for (const unit of kraftGuide.boulders) {
    if (
      ['125752769', '106657477', '123856651', '123856648'].includes(
        unit.sourceIdentity.mpId,
      )
    )
      assert.deepEqual(unit.faces, [], unit.id)
    for (const climb of unit.climbs)
      if (climb.contentDimensions.parent === 'disputed')
        assert.ok(!ledger.some(row => row.climbId === climb.id), climb.id)
  }
  assert.equal(byMp.get('124086140').climb.name, 'Southwest Arête')
  assert.equal(byMp.get('124086140').climb.contentDimensions.face, 'known')
  assert.equal(
    ledger.find(row => row.mpRouteId === '124086140').orientation,
    'west',
  )
})

test('matcher requires the controlled exact ID and primary face fact, never names or approach', () => {
  const rule = sourceFaceRules[0]
  const { unit, climb } = structuredClone(byMp.get(rule.mpRouteId))
  unit.name = 'Northwest Name'
  climb.name = 'East Face'
  assert.equal(matchSourceFaceRule(unit, climb, rule).orientation, 'southwest')
  const observation = climb.routeFacts.observations.find(
    item => item.publisher === 'Mountain Project',
  )
  observation.facts.face = []
  observation.facts.approach = [
    'Walk to the southwest face of the neighboring rock.',
  ]
  assert.equal(matchSourceFaceRule(unit, climb, rule), null)
  const neighbor = byMp.get('122003762')
  assert.equal(
    matchSourceFaceRule(neighbor.unit, neighbor.climb, {
      mpRouteId: '122003762',
      mpParentId: '122003728',
      orientation: 'west',
    }),
    null,
  )
  const conflict = structuredClone(byMp.get(rule.mpRouteId))
  conflict.climb.parentObservations[0].parentUnitId = 'different-source-unit'
  assert.equal(matchSourceFaceRule(conflict.unit, conflict.climb, rule), null)
  assert.equal(
    explicitFaceOrientation('South-facing line on a small adjacent boulder.'),
    null,
  )
  assert.equal(
    explicitFaceOrientation(
      'Wave-shaped boulder ten feet right/east of The Prowler.',
    ),
    null,
  )
  for (const fact of [
    'Right of North Face Left',
    'East face of the neighboring boulder',
    'North side of a separate rock',
    'West face of another boulder',
  ])
    assert.equal(explicitFaceOrientation(fact), null, fact)
})

test('source face validation rejects changed facts, dates, orientation and physical-verification claims', () => {
  for (const change of [
    face => {
      face.sourceFaceObservations[0].sourceFact = 'Guessed north face.'
    },
    face => {
      face.sourceFaceObservations[0].sourceId = 'mp-route-unknown'
    },
    face => {
      face.sourceFaceObservations[0].retrievedAt = '2026-10-02'
    },
    face => {
      face.orientation = 'north'
    },
    face => {
      face.orientationStatus = 'field-verified'
    },
    face => {
      face.sourceFaceObservations = []
    },
  ]) {
    const guide = structuredClone(kraftGuide)
    const face = guide.boulders
      .flatMap(unit => unit.faces)
      .find(item => item.id === ledger[0].faceId)
    change(face)
    assert.ok(validateSourceFaces(guide).length)
  }
  assert.deepEqual(validateSourceFaces(kraftGuide), [])
})
