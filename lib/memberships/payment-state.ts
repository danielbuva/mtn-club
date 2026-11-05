import type { MembershipAccount } from './account'

export function getMembershipPaymentState(account: MembershipAccount | null) {
  if (!account?.schemaReady) return 'unavailable'
  if (account.restriction !== 'normal') return 'restricted'
  if (account.accessActive) return 'active'
  if (account.application?.status === 'withdrawn') return 'withdrawn'
  if (
    account.application?.ageStatus === 'minor' &&
    account.application.guardianConsent !== 'confirmed'
  ) {
    return 'guardian'
  }
  if (account.latestZelleStatus === 'claimed') return 'pending'
  if (account.zelleActivationPending) return 'activation'
  // The initial application's payment flag stays true after confirmation.
  // Only an actual current claim can put a renewal into payment review.
  if (
    account.application?.status === 'confirmed' ||
    account.hasExpiredEntitlement
  ) {
    return account.latestZelleStatus === 'rejected' ? 'rejected' : 'renewal'
  }
  if (account.latestZelleStatus === 'confirmed') return 'activation'
  if (!account.application) return 'incomplete'
  if (account.latestZelleStatus === 'rejected') return 'rejected'
  if (
    account.latestZelleStatus === null &&
    account.application.duesPaymentClaimed
  ) {
    return 'pending'
  }
  return 'initial'
}

export function getMembershipSummary(account: MembershipAccount | null) {
  const state = getMembershipPaymentState(account)
  switch (state) {
    case 'unavailable':
      return 'We could not load your membership status right now.'
    case 'restricted':
      return `Your account is ${account?.restriction}.`
    case 'active':
      return 'Your membership is active. Zelle renewal opens after your current access expires.'
    case 'withdrawn':
      return 'Your application was withdrawn. Contact club leadership before sending dues.'
    case 'guardian':
      return 'Guardian consent is still required before leadership can activate your membership.'
    case 'pending':
      return 'Leadership is checking your new Zelle payment claim.'
    case 'activation':
      return 'Your payment is confirmed. Contact club leadership to complete membership activation.'
    case 'renewal':
      return 'Your membership has expired. Send new dues through Zelle and report the payment to renew for 12 months.'
    case 'rejected':
      return 'Leadership could not match the previous payment claim. Check the Zelle details before reporting a new payment.'
    case 'incomplete':
      return 'Complete your membership application before reporting a dues payment.'
    case 'initial':
      return 'Your form is complete. Send your dues to receive full membership access.'
  }
}
