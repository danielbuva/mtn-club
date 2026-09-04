import assert from 'node:assert/strict'
import test from 'node:test'
import { openAuthFlow, sealAuthFlow } from '../lib/auth/flow-token.ts'
import { getOAuthLinkErrorMessage } from '../lib/auth/oauth-link.ts'
import {
  hasRecentRecoveryProof,
  matchesPasswordReceipt,
} from '../lib/auth/recovery-policy.ts'
import {
  connectedOAuthProviders,
  isExpectedLinkedAccount,
  parseOAuthProvider,
} from '../lib/auth/sign-in-methods.ts'

test('link status uses actual identities, never editable metadata or email matches', () => {
  assert.deepEqual(
    connectedOAuthProviders([{ provider: 'google' }, { provider: 'email' }]),
    ['google'],
  )
  assert.deepEqual(connectedOAuthProviders(), [])
  assert.equal(parseOAuthProvider('Google'), null)
  assert.equal(parseOAuthProvider('email'), null)
  assert.equal(
    isExpectedLinkedAccount(
      { userId: 'a', provider: 'discord' },
      {
        id: 'a',
        email: 'same@example.com',
        identities: [{ provider: 'google' }],
      },
    ),
    false,
  )
  assert.equal(
    isExpectedLinkedAccount(
      { userId: 'a', provider: 'discord' },
      { id: 'b', identities: [{ provider: 'discord' }] },
    ),
    false,
  )
  assert.equal(
    isExpectedLinkedAccount(
      { userId: 'a', provider: 'discord' },
      { id: 'a', identities: [{ provider: 'discord' }] },
    ),
    true,
  )
})
test('flow cookies reject edits, wrong keys, malformed and expired receipts', () => {
  const secret = 'isolated-flow-signing-key'
  const value = { userId: 'a', provider: 'google', expiresAt: 2000 }
  const token = sealAuthFlow(value, secret)
  assert.deepEqual(openAuthFlow(token, secret, 1000), value)
  assert.equal(openAuthFlow(token, secret, 2000), null)
  assert.equal(openAuthFlow(token, 'wrong-key', 1000), null)
  assert.equal(openAuthFlow(token, '', 1000), null)
  for (const invalid of [
    undefined,
    '',
    'bad',
    token + '.extra',
    token.replace(token[0], '_'),
    'x'.repeat(5000),
  ])
    assert.equal(openAuthFlow(invalid, secret, 1000), null)
  const edited =
    Buffer.from(JSON.stringify({ ...value, userId: 'attacker' })).toString(
      'base64url',
    ) +
    '.' +
    token.split('.')[1]
  assert.equal(openAuthFlow(edited, secret, 1000), null)
  assert.throws(() => sealAuthFlow(value, ''))
})
test('password flow requires recent recovery/invite AMR, not a URL flag or OAuth login', () => {
  const now = 2_000_000
  for (const method of ['recovery', 'invite'])
    assert.equal(
      hasRecentRecoveryProof([{ method, timestamp: now / 1000 }], now),
      true,
    )
  for (const amr of [
    null,
    'recovery',
    { method: 'recovery' },
    [{ method: 'password', timestamp: now / 1000 }],
    [{ method: 'oauth', timestamp: now / 1000 }],
    [{ method: 'recovery', timestamp: 1 }],
    [{ method: 'recovery', timestamp: now / 1000 + 60 }],
  ])
    assert.equal(hasRecentRecoveryProof(amr, now), false)
})
test('password receipts are bound to both authenticated user and session', () => {
  const receipt = { userId: 'a', sessionId: 'session-1' }
  assert.equal(matchesPasswordReceipt(receipt, 'a', 'session-1'), true)
  assert.equal(matchesPasswordReceipt(receipt, 'b', 'session-1'), false)
  assert.equal(matchesPasswordReceipt(receipt, 'a', 'session-2'), false)
  assert.equal(matchesPasswordReceipt(null, 'a', 'session-1'), false)
})
test('link conflicts require verified support review and never expose raw provider errors', () => {
  assert.match(
    getOAuthLinkErrorMessage({ code: 'identity_already_exists' }),
    /verifying you own both/,
  )
  assert.match(
    getOAuthLinkErrorMessage({ code: 'multiple_accounts' }),
    /Nothing was merged/,
  )
  assert.doesNotMatch(
    getOAuthLinkErrorMessage({ message: 'secret raw payload' }),
    /secret/,
  )
})
