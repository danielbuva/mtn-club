import assert from 'node:assert/strict'
import test from 'node:test'
import { kraftGuide } from '../lib/kraft/data.ts'
import { gradeRange, searchGuide } from '../lib/kraft/search.ts'
import { validateGuide } from '../lib/kraft/validate.ts'

test('published guide has connected source, physical-face and licensed-asset records', () => {
  assert.deepEqual(validateGuide(kraftGuide), [])
})

test('local discovery handles climb names, aliases, areas and V grade boundaries', () => {
  const query = (query, grade = 'all', areaId = '') =>
    searchGuide(kraftGuide, { query, grade, areaId })
  assert.equal(query('Plumber')[0].climbs[0].id, 'plumbers-crack')
  assert.equal(query('plumbers crack')[0].climbs[0].id, 'plumbers-crack')
  assert.equal(query('Monkey Pinch')[0].climbs[0].id, 'hyperglide')
  for (const name of [
    'The Mole',
    'The Clam Bumper',
    'The Spreader',
    'The Redirect',
    'The Rising Sun',
  ]) {
    assert.equal(query(name).flatMap(result => result.climbs).length, 1, name)
  }
  assert.equal(query('cube')[0].boulder.id, 'cube')
  assert.equal(query('East Cluster')[0].boulder.id, 'monkey-bar')
  assert.equal(query('', 'all', 'pearl-area')[0].boulder.id, 'pearl')
  const experts = query('', 'expert').flatMap(result => result.climbs)
  assert.ok(experts.some(climb => climb.name === 'A Clockwork Orange'))
  assert.ok(
    experts.every(climb => (climb.gradeMaxValue ?? climb.gradeValue) >= 9),
  )
  assert.equal(query('does not exist').length, 0)
  assert.equal(query('Plumber', 'hard').length, 0)
})

test('range grades remain discoverable when their upper value overlaps a filter', () => {
  const guide = structuredClone(kraftGuide)
  const climb = guide.boulders[0].climbs[0]
  climb.grade = 'V2–3'
  climb.gradeValue = 2
  climb.gradeMaxValue = 3
  const results = searchGuide(guide, {
    query: climb.name,
    grade: 'moderate',
    areaId: '',
  })
  assert.equal(results[0].climbs[0].id, climb.id)
  assert.equal(gradeRange([climb]), 'V2–V3')
  assert.equal(
    gradeRange(
      kraftGuide.boulders.find(rock => rock.id === 'split-boulder').climbs,
    ),
    'V0–V11',
  )
})

test('publication validation refuses unattached geometry and unlicensed photographs', () => {
  const guide = structuredClone(kraftGuide)
  const face = guide.boulders[0].faces[0]
  face.image = {
    status: 'available',
    src: '/kraft/unlicensed.jpg',
    width: 100,
    height: 100,
    alt: 'Test',
    assetId: 'missing-asset',
  }
  const climb = guide.boulders[0].climbs[0]
  climb.geometry = [
    {
      status: 'authored',
      faceId: 'unknown-face',
      path: 'M0 0L10 10',
      labelPoint: { x: 0, y: 0 },
      sourceIds: [],
      reviewedAt: '',
    },
  ]
  const errors = validateGuide(guide).join('\n')
  assert.match(errors, /photograph is not in licensed download inventory/)
  assert.match(errors, /geometry face is unassigned/)
  assert.match(errors, /route authoring review missing/)
})
