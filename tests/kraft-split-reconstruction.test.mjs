import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { kraftGuide } from '../lib/kraft/data.ts'
import { deriveRouteContent } from '../lib/kraft/route-content-dimensions.ts'
import { splitCatalog } from '../lib/kraft/split-catalog.ts'
import { validateDistributionRights } from '../lib/kraft/validate-rights.ts'

const split = kraftGuide.boulders.find(unit => unit.id === 'split-boulder')
const front = split.climbs.find(climb => climb.id === 'front-side-crack')
const chimney = split.faces.find(face => face.id === 'split-north-chimney')
const assetId = 'split-north-chimney-guide'
const sourceId = 'mtn-club-split-north-chimney-guide'

test('Front Side Crack alone receives the native north chimney reconstruction', () => {
  assert.deepEqual(front.faceIds, [chimney.id])
  assert.deepEqual(chimney.climbIds, [front.id])
  assert.equal(front.faceAssignmentStatus, 'source-backed')
  assert.equal(front.contentDimensions.image, 'reconstruction')
  assert.equal(chimney.orientationStatus, 'source-observation')
  assert.equal(chimney.groupingStatus, 'source-backed')
  assert.equal(chimney.image.status, 'available')
  assert.equal(chimney.image.representation, 'reconstruction')
  assert.equal(chimney.image.width, 1448)
  assert.equal(chimney.image.height, 1086)
  assert.equal(chimney.image.assetId, assetId)
  assert.equal(chimney.image.src, '/kraft/split-north-chimney-guide.webp')
  assert.equal(chimney.review, undefined)
  assert.equal(front.review, undefined)
  assert.equal(front.status, 'source-observation')
})

test('a registered reconstruction does not supply an image-space corridor by itself', () => {
  const imageOnlyFront = structuredClone(front)
  imageOnlyFront.geometry = []
  delete imageOnlyFront.routePathReview
  const content = deriveRouteContent(imageOnlyFront, split.faces)
  assert.equal(content.contentDimensions.image, 'reconstruction')
  assert.equal(content.contentDimensions.topo, 'unavailable')
  assert.notEqual(content.topoEvidence.confidenceLevel, 'high')
})

test('Mole and Slice N Dice remain on the separate north source group without image correspondence', () => {
  const north = split.faces.find(face => face.id === 'split-north')
  const routeIds = ['split-the-mole', 'split-slice-n-dice']
  assert.equal(north.image.status, 'missing')
  assert.deepEqual([...north.climbIds].sort(), [...routeIds].sort())
  for (const routeId of routeIds) {
    const climb = split.climbs.find(climb => climb.id === routeId)
    assert.deepEqual(climb.faceIds, [north.id])
    assert.equal(climb.contentDimensions.image, 'missing')
    assert.equal(climb.contentDimensions.topo, 'unavailable')
    assert.ok(climb.geometry.every(geometry => geometry.status === 'missing'))
    assert.ok(climb.geometry.every(geometry => geometry.faceId === north.id))
    assert.ok(!chimney.climbIds.includes(routeId))
  }
})

test('the chimney asset has its own registered original grant and factual photos cannot replace it', () => {
  const asset = kraftGuide.assets.find(asset => asset.id === assetId)
  const source = kraftGuide.sources.find(source => source.id === sourceId)
  assert.equal(asset.kind, 'face-photo')
  assert.equal(asset.src, chimney.image.src)
  assert.equal(asset.license, 'Original MTN Club guide asset')
  assert.deepEqual(asset.distribution.licenseIds, ['MTN-Club-original'])
  assert.deepEqual(asset.sourceIds, [sourceId])
  assert.equal(source.usage, 'licensed-media')
  assert.equal(source.license, asset.license)
  assert.deepEqual(source.distribution, asset.distribution)
  assert.equal(source.url, asset.distribution.evidenceUrl)
  assert.match(source.url, /\/split-north-chimney-guide-provenance\.json$/)
  assert.deepEqual(validateDistributionRights(kraftGuide), [])

  const guide = structuredClone(kraftGuide)
  const changedAsset = guide.assets.find(asset => asset.id === assetId)
  changedAsset.sourceIds = ['mp-split-photo-112791386']
  assert.match(
    validateDistributionRights(guide).join('\n'),
    /split-north-chimney-guide: mp-split-photo-112791386 cannot authorize face-photo distribution/,
  )
})

test('the image integration retains all routes and the original Front, Mole and Slice source observations', () => {
  const routes = kraftGuide.boulders.flatMap(unit => unit.climbs)
  assert.equal(routes.length, 383)
  assert.equal(new Set(routes.map(climb => climb.id)).size, 383)
  assert.deepEqual(
    split.climbs.map(climb => climb.id).sort(),
    splitCatalog.map(climb => climb.id).sort(),
  )
  const dossiers = ['main-a', 'main-b'].flatMap(
    name =>
      JSON.parse(
        readFileSync(
          new URL(
            `../docs/kraft-gauntlet/source-data/route-facts-${name}.json`,
            import.meta.url,
          ),
          'utf8',
        ),
      ).routes,
  )
  for (const mpId of ['106617793', '116385877', '107974932']) {
    const climb = split.climbs.find(climb => climb.sourceIdentity.mpId === mpId)
    const dossier = dossiers.find(dossier => dossier.mpRouteId === mpId)
    assert.deepEqual(
      climb.routeFacts.discrepancyNotes,
      dossier.discrepancyNotes,
    )
    for (const [index, original] of dossier.observations.entries()) {
      const observation = climb.routeFacts.observations[index]
      const source = kraftGuide.sources.find(
        source => source.id === observation.sourceId,
      )
      assert.equal(source.url, original.url)
      assert.deepEqual(observation, {
        sourceId: observation.sourceId,
        publisher: original.source,
        retrievedAt: original.retrievedAt,
        sourceDependency: original.sourceDependency,
        sectionAvailability: original.sectionAvailability,
        facts: original.facts,
        synopsis: original.synopsis,
        unresolved: original.unresolved,
      })
    }
  }
})
