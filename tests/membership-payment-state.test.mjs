import assert from 'node:assert/strict'
import test from 'node:test'
import {
  getMembershipPaymentState,
  getMembershipSummary,
} from '../lib/memberships/payment-state.ts'

const account = {
  schemaReady: true,
  restriction: 'normal',
  accessActive: false,
  hasExpiredEntitlement: false,
  latestZelleStatus: null,
  zelleActivationPending: false,
  application: {
    status: 'submitted',
    ageStatus: 'adult',
    guardianConsent: 'not_required',
    duesPaymentClaimed: false,
  },
}
const expired = {
  ...account,
  hasExpiredEntitlement: true,
  latestZelleStatus: 'confirmed',
  application: {
    ...account.application,
    status: 'confirmed',
    duesPaymentClaimed: true,
  },
}

test('expired members can renew despite the initial application payment flag', () => {
  assert.equal(getMembershipPaymentState(expired), 'renewal')
  assert.match(getMembershipSummary(expired), /expired.*new dues/)
  assert.equal(
    getMembershipPaymentState({ ...expired, latestZelleStatus: 'claimed' }),
    'pending',
  )
  assert.equal(
    getMembershipPaymentState({ ...expired, latestZelleStatus: 'rejected' }),
    'rejected',
  )
})

test('expired account-only and complimentary members can submit renewal claims', () => {
  assert.equal(
    getMembershipPaymentState({ ...expired, application: null }),
    'renewal',
  )
  assert.equal(
    getMembershipPaymentState({ ...expired, latestZelleStatus: null }),
    'renewal',
  )
})

test('active, withdrawn, restricted and guardian states take priority over payment claims', () => {
  assert.equal(
    getMembershipPaymentState({ ...expired, accessActive: true }),
    'active',
  )
  assert.equal(
    getMembershipPaymentState({ ...expired, restriction: 'suspended' }),
    'restricted',
  )
  assert.equal(
    getMembershipPaymentState({
      ...expired,
      application: { ...expired.application, status: 'withdrawn' },
    }),
    'withdrawn',
  )
  assert.equal(
    getMembershipPaymentState({
      ...expired,
      application: {
        ...expired.application,
        ageStatus: 'minor',
        guardianConsent: 'pending',
      },
    }),
    'guardian',
  )
})

test('initial payment claims and blocked activation remain distinct from renewal', () => {
  assert.equal(
    getMembershipPaymentState({ ...expired, zelleActivationPending: true }),
    'activation',
  )
  assert.equal(getMembershipPaymentState(account), 'initial')
  assert.equal(
    getMembershipPaymentState({ ...account, latestZelleStatus: 'claimed' }),
    'pending',
  )
  assert.equal(
    getMembershipPaymentState({ ...account, latestZelleStatus: 'confirmed' }),
    'activation',
  )
  assert.equal(
    getMembershipPaymentState({ ...account, application: null }),
    'incomplete',
  )
  assert.equal(getMembershipPaymentState(null), 'unavailable')
})
