import assert from 'node:assert/strict'
import test from 'node:test'
import { kraftGuide } from '../lib/kraft/data.ts'
import { validateGuide } from '../lib/kraft/validate.ts'
import { syntheticReviewedGuide } from './fixtures/kraft-reviewed-fixture.mjs'

const climb = (guide, id) =>
  guide.boulders.flatMap(rock => rock.climbs).find(route => route.id === id)

test('dated opinions require their actual source dates while undated observations remain valid', () => {
  assert.deepEqual(validateGuide(kraftGuide), [])
  const mole = climb(kraftGuide, 'split-the-mole').conditionObservations[0]
  assert.equal(mole.reportedAt, undefined)
  assert.equal(
    kraftGuide.sources.find(source => source.id === mole.sourceId).publishedAt,
    undefined,
  )
  for (const date of ['2099-01-01', '2023-04-22', undefined]) {
    const guide = structuredClone(kraftGuide)
    const direct = climb(guide, 'monkey-bar-direct')
    direct.conditionObservations[0].reportedAt = date
    assert.match(
      validateGuide(guide).join('\n'),
      /monkey-bar-direct condition: reported date contradicts dated source evidence/,
    )
  }
  const guide = structuredClone(kraftGuide)
  const grade = climb(guide, 'monkey-bar-direct').gradeObservations.find(
    observation => observation.sourceId === 'mp-monkey-direct-scott-2023',
  )
  delete grade.reportedAt
  assert.match(
    validateGuide(guide).join('\n'),
    /monkey-bar-direct grade: reported date contradicts dated source evidence/,
  )
})

test('source and review dates must be real calendar dates with no future or reversed chronology', () => {
  for (const date of ['not-a-date', '2026-02-30', '2099-01-01']) {
    const guide = syntheticReviewedGuide()
    guide.boulders[0].location.review.reviewedAt = date
    guide.boulders[0].faces[0].review.reviewedAt = date
    guide.boulders[0].climbs[0].review.reviewedAt = date
    guide.boulders[0].climbs[0].geometry[0].reviewedAt = date
    assert.match(
      validateGuide(guide).join('\n'),
      /invalid or future .*review.*date/,
    )
  }
  const guide = structuredClone(kraftGuide)
  const source = guide.sources.find(
    item => item.id === 'mp-monkey-direct-scott-2023',
  )
  source.accessedAt = '2023-04-20'
  assert.match(
    validateGuide(guide).join('\n'),
    /source publication follows access date/,
  )
  guide.reviewedAt = 'not-a-date'
  assert.match(
    validateGuide(guide).join('\n'),
    /invalid or future guide review date/,
  )
})

test('field GPS claims require a matching selected observation and measured review evidence even in a pilot', () => {
  const guide = structuredClone(kraftGuide)
  const location = guide.boulders[0].location
  location.status = 'field-verified'
  assert.match(
    validateGuide(guide).join('\n'),
    /location status contradicts selected coordinate evidence/,
  )
  assert.match(
    validateGuide(guide).join('\n'),
    /field location requires named review and measured uncertainty/,
  )
  location.observations.find(
    observation => observation.selection === 'selected',
  ).status = 'field-verified'
  location.review = {
    reviewer: 'Synthetic test only',
    reviewedAt: '2026-10-01',
    accuracyMeters: -1,
  }
  assert.match(
    validateGuide(guide).join('\n'),
    /field location requires named review and measured uncertainty/,
  )
  location.review.accuracyMeters = 3
  location.observations.find(
    observation => observation.selection === 'selected',
  ).review = { ...location.review }
  assert.deepEqual(validateGuide(guide), [])
  location.status = 'source-observation'
  assert.match(
    validateGuide(guide).join('\n'),
    /location status contradicts selected coordinate evidence/,
  )
})

test('face and climb field claims cannot omit their named physical review', () => {
  const guide = structuredClone(kraftGuide)
  guide.boulders[0].faces[0].orientationStatus = 'field-verified'
  guide.boulders[0].climbs[0].status = 'field-verified'
  const errors = validateGuide(guide).join('\n')
  assert.match(
    errors,
    /field orientation requires named review and physical grouping/,
  )
  assert.match(
    errors,
    /field climb requires named review and resolved physical assignment/,
  )
})

test('grade and condition field claims require their owner review and resolved line identity', () => {
  const guide = structuredClone(kraftGuide)
  const direct = climb(guide, 'monkey-bar-direct')
  direct.gradeObservations[0].status = 'field-verified'
  direct.conditionObservations[0].status = 'field-verified'
  assert.match(
    validateGuide(guide).join('\n'),
    /field observation requires a reviewed field climb and resolved identity/,
  )
  const reviewed = syntheticReviewedGuide()
  const pearl = reviewed.boulders[0].climbs[0]
  pearl.gradeObservations[0].status = 'field-verified'
  assert.deepEqual(validateGuide(reviewed), [])
  pearl.gradeObservations[0].identityStatus = 'unresolved'
  assert.match(
    validateGuide(reviewed).join('\n'),
    /field observation requires a reviewed field climb and resolved identity/,
  )
})

test('a provisional physical rock cannot gain a source-backed face by reciprocal catalog edits', () => {
  const guide = structuredClone(kraftGuide)
  const monkey = guide.boulders.find(rock => rock.id === 'monkey-bar')
  const darwin = monkey.climbs.find(route => route.id === 'monkey-darwin-award')
  const face = monkey.faces[0]
  darwin.faceIds = [face.id]
  darwin.faceAssignmentStatus = 'source-backed'
  face.climbIds.push(darwin.id)
  assert.match(
    validateGuide(guide).join('\n'),
    /source-backed face uses unresolved physical boulder membership/,
  )
  darwin.faceAssignmentStatus = 'editorial-provisional'
  assert.deepEqual(validateGuide(guide), [])
})
