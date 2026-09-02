import assert from 'node:assert/strict'
import test from 'node:test'
import { sanitizeReturnTo } from '../lib/auth/return-to.ts'

test('accepts same-site paths with queries and fragments', () => {
  assert.equal(
    sanitizeReturnTo('/membership?checkout=success#history'),
    '/membership?checkout=success#history',
  )
})

test('rejects external and protocol-relative destinations', () => {
  assert.equal(sanitizeReturnTo('https://example.com/steal'), null)
  assert.equal(sanitizeReturnTo('//example.com/steal'), null)
  assert.equal(sanitizeReturnTo('/\\example.com/steal'), null)
})

test('rejects malformed values and authentication loops', () => {
  assert.equal(sanitizeReturnTo('membership'), null)
  assert.equal(sanitizeReturnTo('/auth/login'), null)
  assert.equal(sanitizeReturnTo('/auth/callback?next=/membership'), null)
  assert.equal(sanitizeReturnTo('/membership\u0000'), null)
})
