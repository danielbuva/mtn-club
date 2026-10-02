import assert from 'node:assert/strict'
import test from 'node:test'
import {
  boulderAccessNotice,
  climbAccessNotice,
} from '../lib/kraft/access-notices.ts'
import { kraftGuide } from '../lib/kraft/data.ts'
import { searchGuide } from '../lib/kraft/search.ts'

const caliman = kraftGuide.boulders.find(
  boulder => boulder.sourceIdentity.mpId === '106800767',
)
const expectedRoutes = [
  ['106802769', 'Bread Box', 'V4'],
  ['106800770', 'Caliman', 'V7'],
  ['106800785', 'Toadstool', 'V4'],
  ['106800777', 'Unnamed', 'V5'],
]

test('the dated source access notice covers only Caliman and its four exact historical routes', () => {
  const before = structuredClone(caliman)
  const notice = boulderAccessNotice(caliman)
  assert.equal(notice.status, 'climbing-closed')
  assert.equal(notice.source.publisher, 'Mountain Project')
  assert.equal(
    notice.source.url,
    'https://www.mountainproject.com/area/106800767/caliman-boulder',
  )
  assert.equal(notice.source.checkedAt, '2026-10-01')
  assert.equal(notice.reportedSignDate, '2012-04-06')
  assert.match(notice.summary, /Mountain Project reports.*prohibited/)
  assert.match(notice.summary, /within 50 feet of cultural sites/)
  assert.deepEqual(
    caliman.climbs.map(climb => [
      climb.sourceIdentity.mpId,
      climb.name,
      climb.grade,
    ]),
    expectedRoutes,
  )
  for (const climb of caliman.climbs)
    assert.equal(climbAccessNotice(climb), notice)
  assert.deepEqual(
    kraftGuide.boulders
      .filter(boulder => boulderAccessNotice(boulder))
      .map(boulder => boulder.id),
    [caliman.id],
  )
  assert.deepEqual(
    kraftGuide.boulders
      .flatMap(boulder => boulder.climbs)
      .filter(climb => climbAccessNotice(climb))
      .map(climb => climb.sourceIdentity.mpId),
    expectedRoutes.map(([id]) => id),
  )
  assert.deepEqual(caliman, before)
})

test('closure lookup never uses a name match, unresolved identity or a correlated parent', () => {
  const unrelated = structuredClone(kraftGuide.boulders[0])
  unrelated.name = caliman.name
  assert.equal(boulderAccessNotice(unrelated), null)
  const unresolved = structuredClone(caliman)
  unresolved.sourceIdentity.identityStatus = 'unresolved'
  assert.equal(boulderAccessNotice(unresolved), null)

  const route = structuredClone(caliman.climbs[0])
  route.parentObservations = route.parentObservations.filter(
    parent => parent.sourceDependency === 'correlated-mp-import',
  )
  assert.equal(climbAccessNotice(route), null)
  route.parentObservations = structuredClone(
    caliman.climbs[0].parentObservations,
  )
  route.parentObservations[0].parentSourceId = 'mp-area-105940477'
  assert.equal(climbAccessNotice(route), null)
  route.parentObservations = caliman.climbs[0].parentObservations
  route.sourceIdentity.mpId = 'another-route'
  route.name = 'Caliman'
  assert.equal(climbAccessNotice(route), null)
})

test('historical closure records preserve names, grades and grade-filter discovery', () => {
  const results = grade =>
    searchGuide(kraftGuide, { query: 'Caliman', grade, areaId: '' })
      .find(result => result.boulder.id === caliman.id)
      ?.climbs.map(climb => [climb.name, climb.grade]) ?? []
  assert.deepEqual(results('all').toSorted(), [
    ['Bread Box', 'V4'],
    ['Caliman', 'V7'],
    ['Toadstool', 'V4'],
    ['Unnamed', 'V5'],
  ])
  assert.deepEqual(results('moderate').toSorted(), [
    ['Bread Box', 'V4'],
    ['Toadstool', 'V4'],
    ['Unnamed', 'V5'],
  ])
  assert.deepEqual(results('hard'), [['Caliman', 'V7']])
  assert.deepEqual(results('easy'), [])
  assert.deepEqual(results('expert'), [])
})
