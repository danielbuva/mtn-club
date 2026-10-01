import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { kraftGuide } from '../lib/kraft/data.ts'
import { searchGuide } from '../lib/kraft/search.ts'
import { validateGuide } from '../lib/kraft/validate.ts'

const facts = JSON.parse(
  readFileSync(
    new URL(
      '../docs/kraft-gauntlet/source-data/kraft-pilot-catalog-facts.json',
      import.meta.url,
    ),
    'utf8',
  ),
)

test('expanded runtime retains all 58 pilot routes with their published grades and risks', () => {
  assert.deepEqual(validateGuide(kraftGuide), [])
  assert.equal(kraftGuide.boulders.flatMap(rock => rock.climbs).length, 383)
  assert.equal(
    facts.reduce((count, table) => count + table.routeCount, 0),
    58,
  )
  for (const table of facts) {
    const rock = kraftGuide.boulders.find(
      item => item.coverage?.sourceId === table.boulderSourceId,
    )
    assert.ok(rock)
    assert.equal(rock.coverage.status, 'source-catalog')
    assert.equal(rock.climbs.length, table.routeCount)
    assert.deepEqual(
      new Set(rock.climbs.map(climb => climb.id)),
      new Set(table.routes.map(route => route.id)),
    )
    for (const route of table.routes) {
      const climb = rock.climbs.find(item => item.id === route.id)
      assert.ok(climb)
      assert.ok(climb.sourceIds.includes(table.boulderSourceId))
      assert.ok(
        kraftGuide.sources.some(
          source =>
            source.id === route.sourceId && source.url === route.routeUrl,
        ),
      )
      for (const [grade, system] of [
        [route.grade, 'V'],
        [route.fontGrade, 'Font'],
      ])
        assert.ok(
          climb.gradeObservations.some(
            observation =>
              observation.grade === grade &&
              observation.system === system &&
              observation.identityStatus === 'source-linked',
          ),
        )
      assert.equal(climb.gradeValue, route.gradeValue)
      assert.equal(
        climb.gradeMaxValue ?? climb.gradeValue,
        route.gradeMaxValue ?? route.gradeValue,
      )
      if (route.risk) assert.ok(climb.risk?.includes(route.risk))
    }
  }
})

test('route facts have original sourced synopses without converting prose into authored geometry', () => {
  for (const climb of kraftGuide.boulders.flatMap(rock => rock.climbs)) {
    assert.equal(climb.status, 'source-observation')
    if (climb.betaStatus === 'catalog-only') {
      for (const field of [
        'face',
        'start',
        'path',
        'finish',
        'constraints',
        'approach',
      ])
        assert.deepEqual(climb.routeFacts[field], [])
      assert.ok(climb.routeFacts.unresolved.length)
      assert.notEqual(climb.contentState.status, 'complete')
    } else assert.equal(climb.betaStatus, 'source-synopsis')
    assert.ok(climb.description.trim())
    assert.doesNotMatch(
      climb.description,
      /^Published in this boulder’s route list/,
    )
    for (const geometry of climb.geometry)
      if (geometry.status === 'authored') {
        const face = kraftGuide.boulders
          .flatMap(rock => rock.faces)
          .find(item => item.id === geometry.faceId)
        assert.equal(face?.image.status, 'available')
        assert.ok(geometry.reviewedAt.trim())
      }
  }
  assert.deepEqual(
    kraftGuide.boulders
      .flatMap(rock => rock.climbs)
      .filter(climb => climb.betaStatus === 'catalog-only')
      .map(climb => climb.id)
      .sort(),
    [
      'mp-route-112868569',
      'ob-route-7a5ee569-74ef-468d-89d5-49a3bf743cc9',
      'ob-route-a32959e7-fe7b-49a0-b95a-8a3fac5053d3',
      'ob-route-cab774c3-d975-5dc5-a617-f4c3a9976450',
    ].sort(),
  )
})

test('expanded catalog finds explicit aliases and grade range upper bounds', () => {
  const find = (query, grade = 'all') =>
    searchGuide(kraftGuide, { query, grade, areaId: '' }).flatMap(
      result => result.climbs,
    )
  assert.equal(find('The Hole')[0].id, 'split-phazed-aka-the-hole')
  assert.equal(find('Classic Monkey')[0].id, 'monkey-bar-right')
  assert.equal(find('Center Face', 'moderate')[0].grade, 'V2-3')
  assert.equal(find('Vajazzled', 'moderate')[0].grade, 'V4-5')
  assert.equal(find('Monkey Far', 'expert')[0].grade, 'V9-10')
  assert.equal(find('Phazed', 'expert')[0].gradeMaxValue, 11)
})

test('a missing catalog record invalidates a complete source catalog claim', () => {
  const guide = structuredClone(kraftGuide)
  guide.boulders[0].climbs.pop()
  assert.match(
    validateGuide(guide).join('\n'),
    /source catalog coverage is incomplete/,
  )
})
