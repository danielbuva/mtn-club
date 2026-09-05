import assert from 'node:assert/strict'
import test from 'node:test'
import { ADMIN_CAPABILITIES, ADMIN_NAV_ITEMS } from '../lib/admin/constants.ts'
import { buildMailingListCsv, escapeCsvCell } from '../lib/admin/csv.ts'
import {
  buildMembershipAccessSnapshot,
  countFirstActivationsInRange,
} from '../lib/admin/membership-access.ts'

test('part-one navigation contains only active admin workspaces', () => {
  assert.deepEqual(
    ADMIN_NAV_ITEMS.map(item => item.label),
    [
      'Overview',
      'Trips',
      'Registration',
      'Membership',
      'Accounts',
      'Analytics',
      'Mailing List',
      'Gallery',
      'Leadership & Access',
      'Settings',
    ],
  )
  assert.equal(
    ADMIN_NAV_ITEMS.some(item =>
      ['RSVPs', 'Carpools', 'Attendance', 'Announcements', 'Gear'].includes(
        item.label,
      ),
    ),
    false,
  )
})

test('every visible navigation capability is part of the strict capability set', () => {
  const capabilities = new Set(ADMIN_CAPABILITIES)
  for (const item of ADMIN_NAV_ITEMS) {
    assert.equal(capabilities.has(item.capability), true)
  }
})

test('mailing-list export quotes fields and neutralizes spreadsheet formulas', () => {
  assert.equal(escapeCsvCell('Dax "D"'), '"Dax ""D"""')
  assert.equal(escapeCsvCell('=HYPERLINK("bad")'), '"\'=HYPERLINK(""bad"")"')
  assert.equal(
    buildMailingListCsv([
      {
        email: 'member@example.com',
        displayName: 'Member, One',
        consentSource: 'account_settings',
        subscribedAt: '2026-09-02T12:00:00.000Z',
      },
    ]),
    'email,display_name,consent_source,subscribed_at\n"member@example.com","Member, One","account_settings","2026-09-02T12:00:00.000Z"',
  )
})

test('membership metrics use current grants rather than stale status rows', () => {
  const snapshot = buildMembershipAccessSnapshot({
    now: '2026-09-03T12:00:00.000Z',
    entitlements: [
      {
        user_id: 'paid-active',
        starts_at: '2026-09-01T12:00:00.000Z',
        ends_at: '2027-09-01T12:00:00.000Z',
        revoked_at: null,
        payment_id: null,
        zelle_payment_id: 'zelle-1',
      },
      {
        user_id: 'expired',
        starts_at: '2025-01-01T00:00:00.000Z',
        ends_at: '2026-01-01T00:00:00.000Z',
        revoked_at: null,
        payment_id: 'stripe-1',
        zelle_payment_id: null,
      },
      {
        user_id: 'suspended',
        starts_at: '2026-08-01T00:00:00.000Z',
        ends_at: '2027-08-01T00:00:00.000Z',
        revoked_at: null,
        payment_id: 'stripe-2',
        zelle_payment_id: null,
      },
    ],
    overrides: [
      {
        user_id: 'complimentary',
        starts_at: '2026-09-02T00:00:00.000Z',
        ends_at: null,
        revoked_at: null,
      },
    ],
    restrictions: [{ user_id: 'suspended', restriction: 'suspended' }],
  })

  assert.deepEqual([...snapshot.activeUserIds].sort(), [
    'complimentary',
    'paid-active',
  ])
  assert.deepEqual([...snapshot.paidUserIds], ['paid-active'])
  assert.equal(
    countFirstActivationsInRange(
      snapshot.firstActivationByUser,
      '2026-09-01',
      '2026-12-10',
    ),
    2,
  )
})
