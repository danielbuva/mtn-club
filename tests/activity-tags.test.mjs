import assert from 'node:assert/strict'
import test from 'node:test'
import {
  isDifficultyTag,
  normalizeActivityTags,
} from '../lib/events/activity-tags.ts'

test('difficulty descriptions cannot become activities in drafts, publication or editing', () => {
  assert.deepEqual(
    normalizeActivityTags([
      ' Hiking ',
      'beginner friendly',
      'Beginner-Friendly',
      'beginner  friendly',
      'climbing',
      'hiking',
      '',
    ]),
    ['hiking', 'climbing'],
  )
  assert.equal(isDifficultyTag('Beginner-Friendly'), true)
  assert.equal(isDifficultyTag('sport climbing'), false)
})
