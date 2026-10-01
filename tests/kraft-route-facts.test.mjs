import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const read = path => JSON.parse(readFileSync(new URL(path, import.meta.url)))
const mp = read('../lib/kraft/mp-inventory.json')
const ob = read('../lib/kraft/openbeta-inventory.json')
const dossiers = ['west-cube', 'pearl-east', 'main-a', 'main-b'].map(name =>
  read(`../docs/kraft-gauntlet/source-data/route-facts-${name}.json`),
)
const routes = dossiers.flatMap(dossier => dossier.routes)

test('every acquired MP route has one factual dossier, including absent source sections', () => {
  for (const dossier of dossiers) {
    assert.equal(dossier.schemaVersion, 1)
    assert.equal(dossier.routeCount, dossier.routes.length)
    assert.match(dossier.usage, /not verified route geometry/)
  }
  assert.equal(
    new Set(routes.map(route => route.mpRouteId)).size,
    routes.length,
  )
  assert.deepEqual(
    routes.map(route => route.mpRouteId).sort(),
    mp.routes.map(route => route.id).sort(),
  )
  for (const route of routes) {
    const source = mp.routes.find(item => item.id === route.mpRouteId)
    assert.equal(route.name, source.name)
    assert.equal(route.mpParentId, source.parentIds[0])
    const observations = route.observations.filter(
      item => item.source === 'Mountain Project',
    )
    assert.equal(observations.length, 1)
    assert.equal(observations[0].sourceId, source.id)
    assert.equal(observations[0].url, source.url)
    assert.equal(observations[0].retrievedAt, source.retrievedAt)
    assert.equal(observations[0].sourceDependency, 'primary-source-page')
  }
})

test('OpenBeta factual observations retain exact correlated IDs and source differences', () => {
  for (const route of routes) {
    const source = ob.routes.find(item => item.originalMpId === route.mpRouteId)
    const observations = route.observations.filter(
      item => item.source === 'OpenBeta',
    )
    assert.equal(observations.length, source ? 1 : 0)
    if (!source) continue
    assert.equal(observations[0].sourceId, source.id)
    assert.equal(observations[0].url, source.sourceUrl)
    assert.equal(observations[0].retrievedAt, source.retrievedAt)
    assert.equal(observations[0].sourceDependency, 'correlated-mp-import')
    if (source.name !== route.name)
      assert.ok(route.discrepancyNotes.some(note => note.includes(source.name)))
  }
})

test('missing route sections stay empty instead of supplying a guessed path', () => {
  for (const route of routes)
    for (const observation of route.observations) {
      assert.ok(
        observation.url && Number.isFinite(Date.parse(observation.retrievedAt)),
      )
      for (const field of [
        'face',
        'start',
        'path',
        'finish',
        'constraints',
        'approach',
      ])
        assert.ok(Array.isArray(observation.facts[field]))
      if (
        Object.values(observation.sectionAvailability).every(
          value => value === 'absent',
        )
      )
        assert.ok(
          Object.values(observation.facts).every(claims => claims.length === 0),
        )
    }
})
