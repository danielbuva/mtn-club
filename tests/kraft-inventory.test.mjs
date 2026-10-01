import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import {
  contentObservations,
  reconcileContent,
} from '../lib/kraft/content-inventory.ts'

const mp = JSON.parse(
  readFileSync(new URL('../lib/kraft/mp-inventory.json', import.meta.url)),
)
const ob = JSON.parse(
  readFileSync(
    new URL('../lib/kraft/openbeta-inventory.json', import.meta.url),
  ),
)

function importedUuid(id) {
  const bytes = createHash('sha1')
    .update(Buffer.alloc(16))
    .update(id)
    .digest()
    .subarray(0, 16)
  bytes[6] = (bytes[6] & 0x0f) | 0x50
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  const hex = bytes.toString('hex')
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20),
  ].join('-')
}

test('full source snapshots have unique identities and complete parent closure', () => {
  for (const source of [mp, ob]) {
    const areaIds = new Set(source.areas.map(area => area.id))
    assert.equal(areaIds.size, source.areas.length)
    assert.equal(
      new Set(source.routes.map(route => route.id)).size,
      source.routes.length,
    )
    for (const area of source.areas)
      if (area.parentId) assert.ok(areaIds.has(area.parentId), area.id)
    for (const route of source.routes)
      for (const parent of route.parentIds ?? [route.parentId])
        assert.ok(areaIds.has(parent), route.id)
  }
  assert.equal(
    mp.routes.length,
    mp.areas.find(area => area.kind === 'root').totalRoutes,
  )
})

test('OpenBeta importer links are exact identifiers and retain unresolved origins', () => {
  for (const entity of [...ob.areas, ...ob.routes])
    if (entity.originalMpId)
      assert.equal(entity.id, importedUuid(entity.originalMpId), entity.name)
  const records = reconcileContent()
  for (const route of ob.routes.filter(route => !route.originalMpId)) {
    const record = records.find(item => item.id === `ob-route-${route.id}`)
    assert.ok(record, route.name)
    assert.equal(record.state, 'BLOCKED identity/conflict')
  }
  const conflicts = ob.routes.filter(
    route =>
      route.parentReconciliation?.status !== 'same-numeric-source-parent' &&
      route.parentReconciliation,
  )
  for (const route of conflicts)
    assert.equal(
      records.find(item => item.id === `mp-route-${route.originalMpId}`).state,
      'BLOCKED identity/conflict',
    )
})

test('reconciliation retains every source observation and original grade/parent', () => {
  const records = reconcileContent()
  assert.equal(
    records.flatMap(record => record.observations).length,
    contentObservations.length,
  )
  assert.equal(
    new Set(contentObservations.map(observation => observation.id)).size,
    contentObservations.length,
  )
  for (const observation of contentObservations) {
    const record = records.find(item => item.id === observation.canonicalId)
    assert.ok(record.observations.includes(observation))
    assert.ok(observation.url && observation.retrievedAt)
  }
  assert.ok(records.every(record => record.state !== 'COMPLETE'))
})

test('mixed grades agree within their system while actual grade conflicts remain visible', () => {
  const records = reconcileContent()
  for (const [id, yds, v] of [
    ['106617793', '5.8', 'V0'],
    ['106629920', '5.9', 'V1'],
    ['107185645', '5.9', 'V2'],
  ]) {
    const route = mp.routes.find(item => item.id === id)
    assert.equal(route.grades.v, v)
    assert.equal(route.grades.yds, yds)
    const record = records.find(item => item.id === `mp-route-${id}`)
    assert.ok(record.observations.some(item => item.source === 'OpenBeta'))
    assert.ok(record.observations.every(item => item.ydsGrade === yds))
    assert.ok(
      !record.reasons.some(reason => reason.startsWith('Source grades differ')),
    )
  }
  const appleCider = records.find(item => item.id === 'mp-route-121866629')
  assert.ok(
    appleCider.reasons.some(reason =>
      reason.startsWith('Source grades differ'),
    ),
  )
  assert.deepEqual(
    appleCider.observations.map(item => item.grade),
    ['V4', 'V2+'],
  )
})
