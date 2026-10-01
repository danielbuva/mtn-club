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

test('dated parent tables retain all 58 route identities, published grades and risks', () => {
  assert.deepEqual(validateGuide(kraftGuide), [])
  assert.equal(kraftGuide.boulders.flatMap(rock => rock.climbs).length, 58)
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
    assert.equal(climb.betaStatus, 'source-synopsis')
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
