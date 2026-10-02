import assert from 'node:assert/strict'
import test from 'node:test'
import { kraftGuide } from '../lib/kraft/data.ts'
import { validateGuide } from '../lib/kraft/validate.ts'
import { syntheticReviewedGuide } from './fixtures/kraft-reviewed-fixture.mjs'

test('a confirmed route face cannot refer to a provisional physical group', () => {
  const guide = structuredClone(kraftGuide)
  const direct = guide.boulders
    .flatMap(rock => rock.climbs)
    .find(climb => climb.id === 'monkey-bar-direct')
  direct.faceAssignmentStatus = 'source-backed'
  assert.match(
    validateGuide(guide).join('\n'),
    /source-backed face assignment uses provisional physical grouping/,
  )
  direct.faceAssignmentStatus = 'editorial-provisional'
  assert.deepEqual(validateGuide(guide), [])
})

test('each field-reviewed coordinate needs its own named review, real date and uncertainty', () => {
  const guide = structuredClone(kraftGuide)
  const observation = guide.boulders[0].location.observations.find(
    observation => observation.selection !== 'selected',
  )
  observation.status = 'field-verified'
  assert.match(
    validateGuide(guide).join('\n'),
    /field coordinate observation requires its own named review and measured uncertainty/,
  )
  observation.review = {
    reviewer: 'SYNTHETIC coordinate test; no field review performed',
    reviewedAt: '2026-10-01',
    accuracyMeters: 5,
  }
  assert.deepEqual(validateGuide(guide), [])
  for (const date of ['2026-02-30', '2099-01-01']) {
    observation.review.reviewedAt = date
    assert.match(
      validateGuide(guide).join('\n'),
      /invalid or future review date/,
    )
  }
  observation.review.reviewedAt = '2026-10-01'
  observation.review.accuracyMeters = -1
  assert.match(
    validateGuide(guide).join('\n'),
    /field coordinate observation requires its own named review and measured uncertainty/,
  )
})

test('selected field-coordinate review remains tied to the plotted location review', () => {
  const guide = syntheticReviewedGuide()
  assert.deepEqual(validateGuide(guide), [])
  const selected = guide.boulders[0].location.observations.find(
    observation => observation.selection === 'selected',
  )
  selected.review.accuracyMeters = 20
  assert.match(
    validateGuide(guide).join('\n'),
    /plotted field review contradicts selected coordinate review/,
  )
})

test('edition review cannot precede its source retrievals', () => {
  const guide = structuredClone(kraftGuide)
  guide.reviewedAt = '2026-09-29'
  assert.match(
    validateGuide(guide).join('\n'),
    /source access follows the guide review date/,
  )
})

test('conflicting or identical duplicate source identifiers cannot publish', () => {
  for (const conflict of [false, true]) {
    const guide = structuredClone(kraftGuide)
    const duplicate = { ...guide.sources[0] }
    if (conflict) duplicate.url = 'https://example.com/conflicting-source'
    guide.sources.push(duplicate)
    assert.match(validateGuide(guide).join('\n'), /Duplicate content ID/)
  }
})

test('unrelated and proprietary permission URLs cannot replace audited media grants', () => {
  for (const original of [kraftGuide, syntheticReviewedGuide()]) {
    for (const owner of ['asset', 'source']) {
      const guide = structuredClone(original)
      if (owner === 'asset') {
        guide.assets[0].distribution.evidenceUrl =
          'https://example.com/permission'
        assert.match(
          validateGuide(guide).join('\n'),
          /asset rights evidence is not its audited source grant/,
        )
      } else {
        const source = guide.sources.find(
          item => item.id === 'mtn-club-pearl-southeast-guide',
        )
        source.distribution.evidenceUrl =
          'https://www.mountainproject.com/photo/106120934'
        assert.match(
          validateGuide(guide).join('\n'),
          /supported source distribution rights missing/,
        )
      }
    }
  }
})

test('a declared license does not authorize an unaudited replacement source URL', () => {
  const guide = structuredClone(kraftGuide)
  const source = guide.sources.find(
    item => item.id === 'mtn-club-pearl-southeast-guide',
  )
  source.url = 'https://www.mountainproject.com/photo/106120934'
  assert.match(
    validateGuide(guide).join('\n'),
    /supported source distribution rights missing/,
  )
})
