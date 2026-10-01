import assert from 'node:assert/strict'
import test from 'node:test'
import { kraftGuide } from '../lib/kraft/data.ts'
import { validateGuide } from '../lib/kraft/validate.ts'

test('missing orientation and invalid physical grouping cannot publish face records', () => {
  const missing = structuredClone(kraftGuide)
  delete missing.boulders[0].faces[0].orientationStatus
  assert.match(
    validateGuide(missing).join('\n'),
    /invalid or missing face orientation status/,
  )
  const invalid = structuredClone(kraftGuide)
  invalid.boulders[0].faces[0].groupingStatus = 'banana'
  assert.match(
    validateGuide(invalid).join('\n'),
    /invalid or missing face grouping status/,
  )
  invalid.boulders[0].climbs[0].faceAssignmentStatus = 'banana'
  assert.match(
    validateGuide(invalid).join('\n'),
    /invalid or missing face assignment status/,
  )
})

test('unknown evidence and publication states fail closed', () => {
  const guide = structuredClone(kraftGuide)
  guide.status = 'banana'
  guide.boulders[0].location.status = 'banana'
  guide.boulders[0].location.observations[0].status = 'banana'
  guide.boulders[0].climbs[0].status = 'banana'
  guide.boulders[0].climbs[0].gradeObservations[0].status = 'banana'
  guide.boulders[0].climbs[0].gradeObservations[0].system = 'banana'
  guide.sources[0].usage = 'banana'
  guide.assets[0].kind = 'banana'
  const errors = validateGuide(guide).join('\n')
  for (const label of [
    'guide status',
    'location evidence status',
    'coordinate evidence status',
    'climb evidence status',
    'grade evidence status',
    'grade system',
    'source usage',
    'asset kind',
  ])
    assert.ok(errors.includes(`invalid or missing ${label}`), label)
})

test('dated post-break opinions retain individual attribution and cannot replace the selected grade implicitly', () => {
  const direct = kraftGuide.boulders
    .flatMap(rock => rock.climbs)
    .find(climb => climb.id === 'monkey-bar-direct')
  const opinions = direct.gradeObservations.filter(
    observation => observation.reportedAt,
  )
  assert.deepEqual(
    opinions.map(({ grade, reportedAt, sourceId }) => [
      grade,
      reportedAt,
      sourceId,
    ]),
    [
      ['V10', '2023-04-21', 'mp-monkey-direct-scott-2023'],
      ['V8', '2024-03-28', 'mp-monkey-direct-radke-2024'],
    ],
  )
  assert.deepEqual(
    direct.conditionObservations.map(observation => observation.reportedAt),
    ['2023-04-21', '2024-03-28'],
  )
  for (const observation of direct.conditionObservations) {
    assert.equal(observation.status, 'source-observation')
    assert.match(
      observation.note,
      /present condition|effect remain|does not establish/,
    )
    const source = kraftGuide.sources.find(
      source => source.id === observation.sourceId,
    )
    assert.equal(source.publishedAt, observation.reportedAt)
    assert.match(source.url, /#Comment-/)
  }
  assert.equal(direct.grade, 'V8')
  assert.equal(direct.selectedGradeSourceId, 'mp-monkey-direct')
  const guide = structuredClone(kraftGuide)
  const changed = guide.boulders
    .flatMap(rock => rock.climbs)
    .find(climb => climb.id === direct.id)
  changed.grade = 'V10'
  changed.gradeValue = 10
  assert.match(
    validateGuide(guide).join('\n'),
    /selected V grade has no linked source observation/,
  )
})

test('retrievable north-face/descent and landing facts remain attributed without authored paths', () => {
  const cube = kraftGuide.boulders.find(rock => rock.id === 'cube')
  const poser = cube.climbs.find(climb => climb.id === 'perfect-poser')
  assert.deepEqual(poser.faceIds, ['cube-north'])
  assert.ok(poser.sourceIds.includes('mp-route-111470042'))
  assert.match(poser.description, /North-face|descent/)
  const face = cube.faces.find(face => face.id === 'cube-north')
  assert.equal(face.orientation, 'N')
  assert.equal(face.orientationStatus, 'source-observation')
  const decision = kraftGuide.boulders
    .flatMap(rock => rock.climbs)
    .find(climb => climb.id === 'split-decision')
  assert.match(decision.description, /jumbled rocks/)
  assert.match(decision.risk, /source observation/)
})
