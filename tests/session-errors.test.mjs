import assert from 'node:assert/strict'
import test from 'node:test'
import { isStaleAuthSessionError } from '../lib/auth/session-errors.ts'

test('recognizes invalid refresh tokens and missing stale sessions', () => {
  assert.equal(
    isStaleAuthSessionError({ code: 'refresh_token_not_found' }),
    true,
  )
  assert.equal(
    isStaleAuthSessionError({
      name: 'AuthSessionMissingError',
      message: 'Auth session missing!',
    }),
    true,
  )
})

test('does not suppress unrelated authentication failures', () => {
  assert.equal(
    isStaleAuthSessionError({ code: 'unexpected_failure', message: 'Down' }),
    false,
  )
  assert.equal(isStaleAuthSessionError(null), false)
})
