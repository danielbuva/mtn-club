import assert from 'node:assert/strict'
import test from 'node:test'
import {
  buildMembershipReviewAccounts,
  getApplicantClaimTimestamp,
} from '../lib/admin/membership-review.ts'

const account = {
  id: 'new',
  email: 'new@example.com',
  created_at: '2026-09-03',
}

test('new auth accounts appear without a profile, application, or payment claim', () => {
  const [row] = buildMembershipReviewAccounts([], [account], new Map())
  assert.equal(row.user_id, account.id)
  assert.equal(row.contact_email, account.email)
  assert.equal(row.status, 'account')
  assert.equal(row.dues_payment_claimed, false)
  assert.equal(row.age_status, null)
  assert.equal(row.guardian_consent, null)
})

test('existing applications retain consent and payment details without duplicate accounts', () => {
  const application = {
    user_id: account.id,
    full_name: 'Existing applicant',
    contact_email: account.email,
    age_status: 'minor',
    guardian_consent: 'pending',
    dues_payment_claimed: true,
    dues_claimed_at: '2026-09-02T17:30:00Z',
    primary_interest: 'Hiking',
    experience_notes: null,
    status: 'submitted',
    created_at: '2026-09-02',
  }
  const rows = buildMembershipReviewAccounts(
    [application],
    [account],
    new Map(),
  )
  assert.deepEqual(rows, [application])
})

test('legacy claims use their application timestamp when no payment row exists', () => {
  assert.equal(
    getApplicantClaimTimestamp({
      dues_payment_claimed: true,
      dues_claimed_at: '2026-09-02T17:30:00Z',
    }),
    '2026-09-02T17:30:00Z',
  )
})

test('payment record timestamps take precedence over the application claim', () => {
  assert.equal(
    getApplicantClaimTimestamp(
      { dues_payment_claimed: true, dues_claimed_at: '2026-09-01T17:30:00Z' },
      { claimed_at: '2026-09-02T17:30:00Z' },
    ),
    '2026-09-02T17:30:00Z',
  )
})

test('unclaimed or missing claim dates are not fabricated', () => {
  assert.equal(
    getApplicantClaimTimestamp({
      dues_payment_claimed: false,
      dues_claimed_at: null,
    }),
    null,
  )
  assert.equal(
    getApplicantClaimTimestamp({
      dues_payment_claimed: true,
      dues_claimed_at: null,
    }),
    null,
  )
})

test('uses profile names and sorts newest accounts first', () => {
  const older = { id: 'older', created_at: '2026-09-01' }
  const rows = buildMembershipReviewAccounts(
    [],
    [older, account],
    new Map([['new', 'New Member']]),
  )
  assert.deepEqual(
    rows.map(row => row.user_id),
    ['new', 'older'],
  )
  assert.equal(rows[0].full_name, 'New Member')
  assert.equal(rows[1].full_name, 'Account')
})
