import assert from 'node:assert/strict'
import test from 'node:test'
import { mergeEmailPreferences } from '../lib/profile/merge-email-preferences.ts'

test('account merges preserve an opt-out from either account and unrelated choices', () => {
  assert.deepEqual(
    mergeEmailPreferences(
      { email: true, tripUpdates: false, digestFrequency: 'weekly' },
      { email: false, tripUpdates: true, general: false },
    ),
    {
      email: false,
      tripUpdates: false,
      general: false,
      digestFrequency: 'weekly',
    },
  )
  assert.deepEqual(mergeEmailPreferences(null, { announcements: false }), {
    announcements: false,
  })
})
