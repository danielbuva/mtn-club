import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import test from 'node:test'
import { kraftGuide } from '../lib/kraft/data.ts'
import { validateDistributionRights } from '../lib/kraft/validate-rights.ts'
import { visibleExistingCorridorFaces } from '../lib/kraft/visible-existing-corridors.ts'

const require = createRequire(import.meta.resolve('next/package.json'))
const sharp = require('sharp')
const warm = kraftGuide.boulders.find(
  unit => unit.sourceIdentity.mpId === '106657477',
)
const warmRoutes = new Set([
  '106657480',
  '107430241',
  '107396283',
  '107116919',
  '107432448',
  '122054608',
  '125574115',
])
const donkeyFace = visibleExistingCorridorFaces.find(
  face => face.mpParentId === '106657477',
)
const donkeyCorridor = donkeyFace.corridors.find(
  corridor => corridor.mpRouteId === '107396283',
)

test('Warm-up Main retains seven image memberships and only the admitted Donkey corridor', () => {
  assert.equal(warm.unitKind, 'source-unit')
  assert.equal(warm.coverage.sourceClimbCount, 15)
  assert.equal(warm.faces.length, 3)
  assert.deepEqual(
    warm.faces.flatMap(face => face.climbIds).sort(),
    [...warmRoutes].map(id => `mp-route-${id}`).sort(),
  )
  for (const face of warm.faces) {
    assert.equal(face.image.assetId, 'warm-main-southwest-guide')
    assert.equal(face.image.representation, 'reconstruction')
    assert.equal(face.review, undefined)
  }
  const relative = warm.faces.find(face =>
    face.id.endsWith('fluffer-donkey-relative-region'),
  )
  assert.equal(relative.orientation, 'unknown')
  assert.equal(relative.orientationStatus, 'unknown')
  assert.equal(relative.groupingStatus, 'editorial-provisional')
  assert.equal(relative.climbIds.length, 4)
  for (const climb of warm.climbs) {
    const eligible = warmRoutes.has(climb.sourceIdentity.mpId)
    assert.equal(
      climb.contentDimensions.image,
      eligible ? 'reconstruction' : 'missing',
      climb.id,
    )
    const hasCorridor = climb.sourceIdentity.mpId === donkeyCorridor.mpRouteId
    assert.equal(
      climb.contentDimensions.topo,
      hasCorridor ? 'corridor' : 'unavailable',
    )
    if (hasCorridor) {
      assert.equal(climb.geometry.length, 1)
      assert.equal(climb.geometry[0].status, 'authored')
      assert.equal(climb.geometry[0].faceId, donkeyFace.faceId)
      assert.equal(climb.geometry[0].path, donkeyCorridor.path)
      assert.deepEqual(climb.geometry[0].labelPoint, donkeyCorridor.entry)
      assert.equal(climb.geometry[0].confidenceLevel, 'moderate')
      assert.equal(climb.geometry[0].annotations.start.kind, 'start-zone')
      assert.equal(
        climb.geometry[0].annotations.start.placement.status,
        'reviewed-region',
      )
    } else assert.ok(climb.geometry.every(item => item.status === 'missing'))
    for (const annotation of Object.values(climb.routeAnnotations ?? {}))
      assert.equal(annotation.placement.status, 'unlocated')
    if (!eligible) assert.deepEqual(climb.faceIds, [])
  }
})

test('the shipped rasters match their accepted candidate records and retain native bounds', async () => {
  const expected = [
    {
      assetId: 'split-north-chimney-guide',
      candidate: '03',
      png: '1e63efe3b84693e15df94c22e84933eddf5fa8726a2485d3df3eb94376e64763',
      input: 'd152d6061ae184969cec5a6b458cb6ec1b1e96fa8fe05b371e8442b20e32b630',
    },
    {
      assetId: 'warm-main-southwest-guide',
      candidate: '02',
      png: '9f821dce4d3b798129e3716ed2b7898b6cefdc42c0e57b3e929812590ad2cd1d',
      input: 'f79d671d02305f8eeec44e2b52e1c34a50cdb4907992b7809300760e25de4fdc',
    },
  ]
  for (const item of expected) {
    const asset = kraftGuide.assets.find(asset => asset.id === item.assetId)
    const record = JSON.parse(
      readFileSync(
        new URL(
          `../public/kraft/${item.assetId}-provenance.json`,
          import.meta.url,
        ),
        'utf8',
      ),
    )
    const pixels = readFileSync(
      new URL(`../public${asset.src}`, import.meta.url),
    )
    const metadata = await sharp(pixels).metadata()
    assert.equal(metadata.width, 1448)
    assert.equal(metadata.height, 1086)
    assert.equal(record.shippedAsset.width, metadata.width)
    assert.equal(record.shippedAsset.height, metadata.height)
    assert.equal(record.shippedAsset.bytes, pixels.length)
    assert.equal(
      record.shippedAsset.sha256,
      createHash('sha256').update(pixels).digest('hex'),
    )
    assert.equal(record.generation.candidate, item.candidate)
    assert.equal(record.generation.originalPng.sha256, item.png)
    assert.equal(record.review.originalPngSha256, item.png)
    assert.equal(record.generation.pixelInputs.length, 1)
    assert.equal(record.generation.pixelInputs[0].sha256, item.input)
    assert.equal(record.generation.factualReferences.length, 3)
    for (const reference of record.generation.factualReferences) {
      assert.equal(reference.generatorPixelInput, false)
      assert.equal(reference.shippedPixels, false)
    }
    assert.equal(record.review.humanReview, 'pending')
    assert.equal(record.review.fieldVerification, 'not performed')
    assert.equal(record.review.routePathApproval, 'pending')
    assert.equal(record.review.guideOutputReview, 'pending')
  }
})

test('Warm-up imagery requires its original creation record and rejected Potato is excluded', () => {
  assert.deepEqual(validateDistributionRights(kraftGuide), [])
  const copy = structuredClone(kraftGuide)
  const asset = copy.assets.find(
    item => item.id === 'warm-main-southwest-guide',
  )
  asset.sourceIds = ['mp-warm-main-photo-107432433']
  assert.match(
    validateDistributionRights(copy).join('\n'),
    /mp-warm-main-photo-107432433 cannot authorize face-photo distribution/,
  )
  assert.ok(
    !kraftGuide.assets.some(asset =>
      /potato/i.test(`${asset.id} ${asset.src}`),
    ),
  )
  assert.equal(kraftGuide.boulders.flatMap(unit => unit.climbs).length, 383)
})
