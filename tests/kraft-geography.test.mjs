import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { ModuleKind, transpileModule } from 'typescript'
import {
  clusterCatalogPoints,
  nearestCatalogCluster,
} from '../lib/kraft/map-placement.ts'

const readJson = path =>
  JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'))
const features = readJson('../public/kraft/geo-features.json')
const provenance = readJson(
  '../docs/kraft-gauntlet/source-data/geo-provenance.json',
)
const mp = readJson('../lib/kraft/mp-inventory.json')
const ob = readJson('../lib/kraft/openbeta-inventory.json')
const surfaces = readJson('../public/kraft/geo-surface-candidates.json')
const surfaceSource = readJson(
  '../docs/kraft-gauntlet/source-data/geo-surface-candidates-2026-10-01.json',
)
const source = readFileSync(
  new URL('../lib/kraft/geography.ts', import.meta.url),
  'utf8',
)
const moduleSource = transpileModule(
  source.replace(
    /^import geographicData[^\n]*\n/,
    `const geographicData = ${JSON.stringify(features)}\n`,
  ),
  { compilerOptions: { module: ModuleKind.ESNext } },
).outputText
const geography = await import(
  `data:text/javascript;base64,${Buffer.from(moduleSource).toString('base64')}`
)

const units = [
  ...mp.areas.filter(area => area.kind === 'source-boulder-unit'),
  ...ob.areas.filter(area => area.leaf && !area.originalMpId),
]

test('all 78 source-unit parent or centroid observations fit the expanded envelope', () => {
  assert.equal(units.length, 78)
  assert.equal(geography.MAP_WIDTH, features.world.width)
  assert.equal(geography.MAP_HEIGHT, features.world.height)
  assert.deepEqual(geography.KRAFT_BOUNDS, provenance.boundsWgs84)
  assert.deepEqual(features.boundsWgs84, provenance.boundsWgs84)
  for (const unit of units) {
    assert.ok(unit.coordinates, unit.name)
    const location = {
      lat: unit.coordinates.latitude,
      lon: unit.coordinates.longitude,
    }
    const point = geography.projectLocation(location)
    assert.ok(point.x >= 0 && point.x <= geography.MAP_WIDTH, unit.name)
    assert.ok(point.y >= 0 && point.y <= geography.MAP_HEIGHT, unit.name)
    const roundTrip = geography.unprojectLocation(point)
    assert.ok(Math.abs(roundTrip.lat - location.lat) < 1e-10, unit.name)
    assert.ok(Math.abs(roundTrip.lon - location.lon) < 1e-10, unit.name)
  }
})

test('scale stays metrically consistent and source vectors remain in bounds', () => {
  const north = geography.projectLocation({ lat: 36.161, lon: -115.417 })
  const south = geography.projectLocation({ lat: 36.16, lon: -115.417 })
  const latitudeMeters = ((0.001 * Math.PI) / 180) * 6378137
  assert.ok(
    Math.abs(
      (south.y - north.y) / geography.worldUnitsForMeters(latitudeMeters) - 1,
    ) < 0.001,
  )
  const kinds = new Set(['trail', 'wash', 'parking', 'road', 'contour'])
  for (const feature of features.features) {
    assert.ok(kinds.has(feature.kind))
    assert.ok(feature.sourceId && feature.sourceUrl)
    for (const point of feature.points) {
      assert.ok(
        Number.isFinite(point.x) && Number.isFinite(point.y),
        feature.id,
      )
      assert.ok(
        point.x >= -0.01 && point.x <= geography.MAP_WIDTH + 0.01,
        feature.id,
      )
      assert.ok(
        point.y >= -0.01 && point.y <= geography.MAP_HEIGHT + 0.01,
        feature.id,
      )
    }
  }
})

test('clusters preserve coincident source identities and split when screen distance permits', () => {
  const points = [
    { id: 'mp-tomahawk', point: { x: 100, y: 100 } },
    { id: 'ob-tomahawk-unresolved', point: { x: 100, y: 100 } },
    { id: 'nearby-unrelated-unit', point: { x: 130, y: 100 } },
    { id: 'far-unit', point: { x: 1000, y: 700 } },
  ]
  const close = clusterCatalogPoints(points, 1)
  assert.deepEqual(
    new Set(close.flatMap(cluster => cluster.ids)),
    new Set(points.map(point => point.id)),
  )
  assert.equal(close.flatMap(cluster => cluster.ids).length, points.length)
  assert.equal(close.length, 2)
  const zoomed = clusterCatalogPoints(points, 2)
  assert.equal(zoomed.length, 3)
  assert.deepEqual(
    zoomed.find(cluster => cluster.ids.includes('mp-tomahawk')).ids,
    ['mp-tomahawk', 'ob-tomahawk-unresolved'],
  )
})

test('nearby chains cannot aggregate distant catalogs into one marker', () => {
  const points = [0, 30, 60, 90, 120, 150].map(x => ({
    id: `source-${x}`,
    point: { x, y: 0 },
  }))
  const clusters = clusterCatalogPoints(points, 1)
  assert.equal(clusters.length, 3)
  const byId = new Map(points.map(point => [point.id, point.point]))
  for (const cluster of clusters)
    for (const first of cluster.ids)
      for (const second of cluster.ids) {
        const a = byId.get(first)
        const b = byId.get(second)
        assert.ok(Math.hypot(a.x - b.x, a.y - b.y) < 44)
      }
  assert.deepEqual(
    new Set(clusters.flatMap(cluster => cluster.ids)),
    new Set(points.map(point => point.id)),
  )
})

test('the mobile overview preserves every source ID across bounded local clusters', () => {
  const points = units.map(unit => ({
    id: `${unit.url ? 'mp' : 'ob'}-${unit.id}`,
    point: geography.projectLocation({
      lat: unit.coordinates.latitude,
      lon: unit.coordinates.longitude,
    }),
  }))
  const factor = 320 / (geography.MAP_WIDTH + 70)
  const clusters = clusterCatalogPoints(points, factor)
  const byId = new Map(points.map(point => [point.id, point.point]))
  assert.ok(clusters.length >= 6, `${clusters.length} overview clusters`)
  assert.equal(clusters.flatMap(cluster => cluster.ids).length, 78)
  assert.equal(new Set(clusters.flatMap(cluster => cluster.ids)).size, 78)
  for (const cluster of clusters)
    for (const first of cluster.ids)
      for (const second of cluster.ids) {
        const a = byId.get(first)
        const b = byId.get(second)
        assert.ok(Math.hypot(a.x - b.x, a.y - b.y) * factor < 44)
      }
})

test('overlapping hit targets activate the nearest intended aggregate center', () => {
  const clusters = [
    { ids: ['twenty-record-center'], point: { x: 100, y: 100 } },
    { ids: ['five-record-center'], point: { x: 118, y: 100 } },
  ]
  assert.deepEqual(nearestCatalogCluster(clusters, { x: 100, y: 100 })?.ids, [
    'twenty-record-center',
  ])
  assert.deepEqual(nearestCatalogCluster(clusters, { x: 118, y: 100 })?.ids, [
    'five-record-center',
  ])
  assert.deepEqual(nearestCatalogCluster(clusters, { x: 102, y: 101 })?.ids, [
    'twenty-record-center',
  ])
  assert.equal(nearestCatalogCluster([], { x: 100, y: 100 }), undefined)
})

test('retained geographic inputs match their provenance hashes', () => {
  for (const file of provenance.files.filter(
    file => !file.path.startsWith('.tmp/'),
  )) {
    const bytes = readFileSync(new URL(`../${file.path}`, import.meta.url))
    assert.equal(bytes.length, file.bytes, file.path)
    assert.equal(
      createHash('sha256').update(bytes).digest('hex'),
      file.sha256,
      file.path,
    )
  }
})

test('aerial candidates retain native pixel geometry and unresolved source associations', () => {
  assert.equal(surfaces.candidates.length, 10)
  assert.equal(surfaces.completePhysicalFootprintsAccepted, 0)
  assert.deepEqual(surfaces.boundsWgs84, geography.KRAFT_BOUNDS)
  const reference = surfaceSource.reference
  const raster = readFileSync(new URL(`../${reference.path}`, import.meta.url))
  assert.equal(
    createHash('sha256').update(raster).digest('hex'),
    reference.sha256,
  )
  const byId = new Map(surfaceSource.candidates.map(item => [item.id, item]))
  for (const candidate of surfaces.candidates) {
    const original = byId.get(candidate.id)
    const area = mp.areas.find(area => area.id === original.catalogSourceId)
    assert.ok(area, candidate.id)
    assert.deepEqual(original.sourcePoint, area.coordinates, candidate.id)
    assert.deepEqual(candidate.sourceUnitIds, original.sourceUnitIds)
    assert.deepEqual(candidate.sourcePoint, original.sourcePoint)
    assert.equal(candidate.sourceUnitIds.length, 1)
    assert.equal(candidate.geometryScope, 'candidate-visible-surface')
    assert.equal(candidate.status, 'candidate')
    assert.equal(candidate.spatialConfidence, 'low')
    assert.equal(candidate.visibleBoundaryConfidence, 'low')
    assert.equal(candidate.sourceAssociationConfidence, 'low')
    assert.equal(candidate.physicalIdentity, 'unresolved')
    assert.equal(candidate.baseBoundary, 'unobserved')
    assert.equal(candidate.rasterId, 134873)
    assert.equal(candidate.sourceId, reference.sourceId)
    assert.equal(candidate.points.length, original.imagePixels.length)
    const extent = reference.extentEpsg3857
    for (const [index, pixel] of original.imagePixels.entries()) {
      const x =
        extent.xmin + (pixel.x / reference.width) * (extent.xmax - extent.xmin)
      const y =
        extent.ymax - (pixel.y / reference.height) * (extent.ymax - extent.ymin)
      const location = {
        lon: (x / 6378137) * (180 / Math.PI),
        lat:
          (2 * Math.atan(Math.exp(y / 6378137)) - Math.PI / 2) *
          (180 / Math.PI),
      }
      const expected = geography.projectLocation(location)
      assert.ok(
        Math.hypot(
          candidate.points[index].x - expected.x,
          candidate.points[index].y - expected.y,
        ) < 0.0072,
        `${candidate.id}, pixel ${index}`,
      )
    }
  }
  assert.equal(
    new Set(surfaces.candidates.flatMap(item => item.sourceUnitIds)).size,
    10,
  )
})
