import assert from 'node:assert/strict'
import test from 'node:test'
import {
  authHref,
  getReturnToFromReferrer,
  getReturnToFromSearchParams,
  recoveryRedirect,
  sanitizeReturnTo,
} from '../lib/auth/return-to.ts'

test('accepts same-site paths with queries and fragments', () => {
  assert.equal(
    sanitizeReturnTo('/membership?checkout=success#history'),
    '/membership?checkout=success#history',
  )
})

test('accepts compatibility parameters and generates only canonical returnTo links', () => {
  for (const key of ['returnTo', 'redirect', 'next']) {
    const params = new URLSearchParams({ [key]: '/trips?type=hike#calendar' })
    assert.equal(
      getReturnToFromSearchParams(params),
      '/trips?type=hike#calendar',
    )
  }
  assert.equal(
    getReturnToFromSearchParams(
      new URLSearchParams({
        returnTo: '/one',
        redirect: '/two',
        next: '/three',
      }),
    ),
    '/one',
  )
  assert.equal(
    authHref('/auth/sign-up', '/trips?q=a&view=b#top'),
    '/auth/sign-up?returnTo=%2Ftrips%3Fq%3Da%26view%3Db%23top',
  )
  assert.equal(
    authHref('/auth/login', 'https://evil.test'),
    '/auth/login?returnTo=%2F',
  )
  const recovery = new URL(
    recoveryRedirect('https://unlvmountainclub.com', '/profile#security'),
  )
  assert.equal(recovery.pathname, '/auth/confirm')
  assert.equal(recovery.searchParams.get('flow'), 'recovery')
  assert.equal(recovery.searchParams.get('returnTo'), '/profile#security')
})

test('rejects encoded auth loops, backslashes, controls and traversal', () => {
  for (const path of [
    '/AUTH/login',
    '/%61uth/login',
    '/auth%2flogin',
    '/%2561uth/login',
    '/%2f%2fevil.test',
    '/%5cevil.test',
    '/foo/../auth/login',
    '/foo/%2e%2e/auth/login',
    '/%00path',
    '/%250apath',
    '/path\t',
    '/%zz',
  ])
    assert.equal(sanitizeReturnTo(path), null, path)
  assert.equal(sanitizeReturnTo('/authors'), '/authors')
  assert.equal(
    sanitizeReturnTo('/trips?filter=auth#auth'),
    '/trips?filter=auth#auth',
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

test('restores same-origin referrers as return paths', () => {
  assert.equal(
    getReturnToFromReferrer(
      'https://unlvmountainclub.com/membership-sign-up?step=2',
      'https://unlvmountainclub.com',
    ),
    '/membership-sign-up?step=2',
  )
  assert.equal(
    getReturnToFromReferrer(
      'https://example.com/membership',
      'https://unlvmountainclub.com',
    ),
    null,
  )
})
