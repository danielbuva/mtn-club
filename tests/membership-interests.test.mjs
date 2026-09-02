import assert from 'node:assert/strict'
import test from 'node:test'
import {
  decodeMembershipInterests,
  encodeMembershipInterests,
} from '../lib/memberships/application-options.ts'

test('round-trips multiple membership interests', () => {
  const interests = ['Hiking', 'Climbing', 'Trail running']
  assert.deepEqual(
    decodeMembershipInterests(encodeMembershipInterests(interests)),
    interests,
  )
})

test('continues to read legacy single-interest applications', () => {
  assert.deepEqual(decodeMembershipInterests('Hiking Trips'), ['Hiking Trips'])
})
