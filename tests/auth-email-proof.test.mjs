import assert from 'node:assert/strict'
import test from 'node:test'
import { verifyEmailProof } from '../lib/auth/verify-email-proof.ts'

const account = {
  id: 'current-user',
  email: 'a@example.com',
  app_metadata: { role: 'member', provider: 'email', other: { keep: true } },
}
function fixtures({
  verified = account,
  current = account,
  error = null,
  saved = true,
} = {}) {
  const writes = []
  const requests = []
  return {
    writes,
    requests,
    services: {
      verify: async (email, code) => {
        requests.push({ email, code })
        return { user: verified, error }
      },
      currentAccount: async () => current,
      saveMetadata: async (id, metadata) => {
        writes.push({ id, metadata })
        return saved
      },
    },
  }
}
test('mailbox proof validates the code and preserves unrelated protected metadata', async () => {
  const fixture = fixtures()
  assert.deepEqual(
    await verifyEmailProof(account, '123456', fixture.services),
    { error: null, verified: true },
  )
  assert.deepEqual(fixture.requests, [{ email: account.email, code: '123456' }])
  assert.equal(fixture.writes[0].id, account.id)
  const { email_verification, ...retained } = fixture.writes[0].metadata
  assert.deepEqual(retained, account.app_metadata)
  assert.equal(email_verification.email, account.email)
  assert.ok(Number.isFinite(Date.parse(email_verification.verified_at)))
})
test('wrong user or mismatched email can never write mailbox proof', async () => {
  for (const verified of [
    null,
    { ...account, id: 'other-user' },
    { ...account, email: 'other@example.com' },
  ]) {
    const fixture = fixtures({ verified })
    assert.match(
      (await verifyEmailProof(account, '123456', fixture.services)).error,
      /does not match/,
    )
    assert.equal(fixture.writes.length, 0)
  }
})
test('an email change while the code is in flight invalidates verification', async () => {
  const fixture = fixtures({
    current: { ...account, email: 'changed@example.com' },
  })
  assert.match(
    (await verifyEmailProof(account, '123456', fixture.services)).error,
    /email has changed/,
  )
  assert.equal(fixture.writes.length, 0)
})
test('invalid, expired, or reused codes and failed saves cannot report success', async () => {
  const invalid = fixtures()
  assert.ok((await verifyEmailProof(account, '12345', invalid.services)).error)
  assert.equal(invalid.requests.length, 0)
  const expired = fixtures({ error: 'This code is expired or already used.' })
  assert.match(
    (await verifyEmailProof(account, '123456', expired.services)).error,
    /expired/,
  )
  assert.equal(expired.writes.length, 0)
  const failed = fixtures({ saved: false })
  assert.match(
    (await verifyEmailProof(account, '123456', failed.services)).error,
    /couldn’t save/,
  )
})
