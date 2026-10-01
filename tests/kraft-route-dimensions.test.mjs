import assert from 'node:assert/strict'
import test from 'node:test'
import { kraftGuide } from '../lib/kraft/data.ts'
import { deriveRouteContent } from '../lib/kraft/route-content-dimensions.ts'
import { validateRouteContent } from '../lib/kraft/validate-route-content.ts'

const entries = kraftGuide.boulders.flatMap(unit =>
  unit.climbs.map(climb => ({
    climb,
    faces: unit.faces,
    ...deriveRouteContent(climb, unit.faces),
  })),
)

test('dimensions retain all routes independently of face, image and topo completeness', () => {
  assert.equal(entries.length, 383)
  assert.equal(
    entries.filter(entry => entry.contentDimensions.identity === 'verified')
      .length,
    383,
  )
  assert.equal(
    entries.filter(entry => entry.contentDimensions.identity === 'disputed')
      .length,
    0,
  )
  assert.ok(
    entries.some(
      entry =>
        entry.contentDimensions.identity === 'verified' &&
        entry.contentDimensions.grade === 'verified' &&
        entry.contentDimensions.image === 'missing',
    ),
  )
  for (const entry of entries) {
    assert.equal(entry.climb.status, 'source-observation')
    assert.ok(entry.topoEvidence.reasons.length)
    assert.notEqual(entry.topoEvidence.confidenceLevel, 'high')
  }
})

test('a native UUID retains checked source identity, source grade and source parent without MP coidentity', () => {
  const native = entries.find(
    entry =>
      entry.climb.name === 'Right Face' &&
      entry.climb.sourceIdentity.mpId === null,
  )
  assert.equal(native.contentDimensions.identity, 'verified')
  assert.equal(native.contentDimensions.grade, 'verified')
  assert.equal(native.contentDimensions.parent, 'verified')
  assert.equal(native.climb.sourceIdentity.identityStatus, 'unresolved')
  assert.equal(native.topoEvidence.confidenceLevel, 'moderate')
  assert.equal(native.topoEvidence.drawingPolicy, 'no-draw')
})

test('dated linked grade disagreements and parent conflicts are separate from exact route identity', () => {
  const monkey = entries.find(entry => entry.climb.id === 'monkey-bar-direct')
  assert.equal(monkey.contentDimensions.identity, 'verified')
  assert.equal(monkey.contentDimensions.parent, 'verified')
  assert.equal(monkey.contentDimensions.grade, 'disputed')
  const lava = entries.find(
    entry => entry.climb.sourceIdentity.mpId === '110174813',
  )
  assert.equal(lava.contentDimensions.identity, 'verified')
  assert.equal(lava.contentDimensions.parent, 'disputed')
  assert.equal(lava.topoEvidence.drawingPolicy, 'no-draw')
})

test('general face, start, path and finish facts support moderate confidence without exact holds', () => {
  const entry = entries.find(
    item => item.contentDimensions.parent === 'verified',
  )
  const climb = structuredClone(entry.climb)
  climb.routeFacts.face = ['West face.']
  climb.routeFacts.start = ['Standing.']
  climb.routeFacts.path = ['Move left across the face.']
  climb.routeFacts.finish = ['Top out.']
  climb.faceIds = []
  climb.geometry = []
  const content = deriveRouteContent(climb, [])
  assert.equal(content.contentDimensions.face, 'unknown')
  assert.equal(content.contentDimensions.topo, 'unavailable')
  assert.equal(content.contentDimensions.image, 'missing')
  assert.equal(content.topoEvidence.confidenceLevel, 'moderate')
  assert.equal(content.topoEvidence.drawingPolicy, 'no-draw')
  assert.deepEqual(climb.geometry, [])
  climb.routeFacts.path = []
  assert.equal(
    deriveRouteContent(climb, []).topoEvidence.confidenceLevel,
    'unresolved',
  )
  climb.faceIds = entry.climb.faceIds
  assert.equal(
    deriveRouteContent(climb, entry.faces).topoEvidence.confidenceLevel,
    'face-only',
  )
})

test('missing finish and generic boulder text do not manufacture corridor evidence', () => {
  const entry = entries.find(item => item.climb.id === 'the-pearl')
  const climb = structuredClone(entry.climb)
  climb.routeFacts.finish = []
  assert.equal(
    deriveRouteContent(climb, entry.faces).topoEvidence.confidenceLevel,
    'face-only',
  )
  climb.faceIds = []
  climb.routeFacts.face = []
  climb.routeFacts.start = ['Standing.']
  climb.routeFacts.path = ['Climb the boulder.']
  climb.routeFacts.finish = ['Top out.']
  assert.equal(
    deriveRouteContent(climb, []).topoEvidence.confidenceLevel,
    'unresolved',
  )
  assert.equal(
    deriveRouteContent(climb, []).topoEvidence.drawingPolicy,
    'no-draw',
  )
})

test('reviewed plural features and general direction support moderate source evidence', () => {
  for (const mpId of [
    '202288017',
    '202287982',
    '202641466',
    '108439752',
    '107406867',
    '117939655',
    '124134233',
  ]) {
    const entry = entries.find(item => item.climb.sourceIdentity.mpId === mpId)
    assert.equal(entry.topoEvidence.confidenceLevel, 'moderate', mpId)
    assert.equal(entry.contentDimensions.topo, 'unavailable', mpId)
  }
})

test('assigned face evidence retains the attached primary source that establishes it', () => {
  const entry = entries.find(item => item.climb.id === 'perfect-poser')
  assert.equal(entry.topoEvidence.confidenceLevel, 'face-only')
  assert.ok(entry.topoEvidence.sourceIds.includes('mp-route-111470042'))
  for (const sourceId of entry.topoEvidence.sourceIds)
    assert.ok(entry.climb.sourceIds.includes(sourceId), sourceId)
})

test('dated authored objects cannot promote high confidence or reviewed SVG without a specific path review', () => {
  const entry = entries.find(item => item.climb.id === 'the-pearl')
  const climb = structuredClone(entry.climb)
  climb.routeFacts.start = ['Left end of the southeast face.']
  climb.routeFacts.path = ['Traverse right across the face.']
  climb.routeFacts.finish = ['Top out at the right edge.']
  const sourceId = climb.routeFacts.observations.find(
    observation => observation.sourceDependency === 'primary-source-page',
  ).sourceId
  const geometry = {
    status: 'authored',
    faceId: climb.faceIds[0],
    path: 'M0,0L1,1',
    labelPoint: { x: 1, y: 1 },
    sourceIds: [sourceId],
    reviewedAt: '2026-10-01',
  }
  climb.geometry = [geometry]
  assert.equal(
    deriveRouteContent(climb, entry.faces).topoEvidence.confidenceLevel,
    'moderate',
  )
  assert.equal(
    deriveRouteContent(climb, entry.faces).contentDimensions.topo,
    'unavailable',
  )
  geometry.confidenceLevel = 'moderate'
  assert.equal(
    deriveRouteContent(climb, entry.faces).contentDimensions.topo,
    'corridor',
  )
  for (const path of [
    'M0',
    'M0,0',
    'M0,0L',
    'M0,0X1,1',
    'M0,0L1,2,3',
    'M0,0L1e309,1',
    'M0,0A5,5,0,2,0,10,10',
  ]) {
    geometry.path = path
    assert.equal(
      deriveRouteContent(climb, entry.faces).contentDimensions.topo,
      'unavailable',
      path,
    )
  }
  geometry.path = 'M0,0L1,1'
  const image = entry.faces.find(face => face.id === geometry.faceId).image
  for (const labelPoint of [
    { x: -1, y: 1 },
    { x: 1, y: -1 },
    { x: image.width + 1, y: 1 },
    { x: 1, y: image.height + 1 },
    { x: Number.NaN, y: 1 },
  ]) {
    geometry.labelPoint = labelPoint
    assert.equal(
      deriveRouteContent(climb, entry.faces).contentDimensions.topo,
      'unavailable',
    )
  }
  geometry.labelPoint = { x: 1, y: 1 }
  geometry.reviewedAt = '9999-99-99'
  assert.equal(
    deriveRouteContent(climb, entry.faces).contentDimensions.topo,
    'unavailable',
  )
  geometry.reviewedAt = '2026-10-01'
  geometry.faceId = 'unknown-face'
  assert.equal(
    deriveRouteContent(climb, entry.faces).contentDimensions.topo,
    'unavailable',
  )
  geometry.faceId = climb.faceIds[0]
  geometry.confidenceLevel = 'high'
  assert.notEqual(
    deriveRouteContent(climb, entry.faces).topoEvidence.confidenceLevel,
    'high',
  )
  geometry.routePathReview = {
    scope: 'specific-route-path',
    method: 'critic-route-path-review',
    reviewer: 'Synthetic classifier fixture',
    reviewedAt: '2026-10-01',
    sourceIds: [sourceId],
    description:
      'Synthetic specific route-path review fixture; no production path is asserted.',
    reviewedSvgPath: geometry.path,
  }
  assert.equal(
    deriveRouteContent(climb, entry.faces).topoEvidence.confidenceLevel,
    'high',
  )
  assert.equal(
    deriveRouteContent(climb, entry.faces).contentDimensions.topo,
    'reviewed',
  )
  geometry.routePathReview.reviewedSvgPath = 'M2,2L3,3'
  assert.equal(
    deriveRouteContent(climb, entry.faces).contentDimensions.topo,
    'unavailable',
  )
})

test('catalog validation checks independent dimension enums and source closure without an image gate', () => {
  assert.deepEqual(validateRouteContent(kraftGuide), [])
  const guide = structuredClone(kraftGuide)
  const climb = guide.boulders[0].climbs[0]
  climb.contentDimensions.grade = 'fabricated'
  climb.topoEvidence.sourceIds.push('missing-source')
  assert.match(
    validateRouteContent(guide).join('\n'),
    /invalid route content dimension grade/,
  )
  assert.match(
    validateRouteContent(guide).join('\n'),
    /unknown or unattached missing-source/,
  )
})

test('image availability changes its dimension without reclassifying source relationships', () => {
  const entry = entries.find(item => item.climb.id === 'the-pearl')
  const initial = deriveRouteContent(entry.climb, entry.faces)
  const faces = structuredClone(entry.faces)
  faces.forEach(face => {
    face.image = { status: 'missing', reason: 'Test image gap' }
  })
  const missing = deriveRouteContent(entry.climb, faces)
  assert.equal(initial.contentDimensions.image, 'available')
  assert.equal(missing.contentDimensions.image, 'missing')
  for (const key of ['identity', 'grade', 'parent', 'face', 'topo'])
    assert.equal(
      initial.contentDimensions[key],
      missing.contentDimensions[key],
      key,
    )
})
