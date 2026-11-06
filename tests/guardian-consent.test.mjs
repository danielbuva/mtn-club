import assert from 'node:assert/strict'
import test from 'node:test'
import {
  guardianCodeEmail,
  guardianInviteEmail,
  guardianSignedEmail,
  participantNoticeEmail,
} from '../lib/guardian/email.ts'
import {
  coverageEnd,
  tripGuardianPresentation,
} from '../lib/guardian/presentation.ts'

const siteUrl = 'https://unlvmountainclub.com'
const status = {
  lastOutcome: null,
  tripCoverage: {
    from: '2026-07-01',
    until: '2027-06-30',
    activities: ['hiking'],
  },
  waiver: {
    state: 'covered',
    current: null,
    validUntil: '2027-03-17',
    signedAt: null,
    signerKind: 'guardian',
    signerName: 'Jordan Parent',
  },
}

test('every trip state has words, and signing never reads as registered', () => {
  for (const state of [
    'covered',
    'risks_pending',
    'not_published',
    'out_of_scope',
    'awaiting_review',
    'waiting_for_guardian',
    'withdrawn',
    'aged_out',
    'expired',
    'updated',
    'needs_signature',
    'legacy',
  ]) {
    const view = tripGuardianPresentation(state, status)
    assert.ok(view.label && view.headline && view.body, state)
    assert.doesNotMatch(view.body, /you’re going|seat is held/i, state)
  }
  assert.match(
    tripGuardianPresentation('covered', status).body,
    /Finish registering/,
  )
  assert.match(
    tripGuardianPresentation('awaiting_review', status).body,
    /once it’s approved/,
  )
})

test('coverage ending at the 18th birthday is stated explicitly', () => {
  assert.equal(
    coverageEnd('2027-03-17', '2027-06-30'),
    'March 17, 2027 (the day before you turn 18)',
  )
  assert.equal(coverageEnd('2027-06-30', '2027-06-30'), 'June 30, 2027')
})

test('guardian emails escape input, describe email codes accurately, and omit private details', () => {
  const invite = guardianInviteEmail({
    siteUrl,
    link: `${siteUrl}/guardian/abc`,
    participantName: 'Riley <script>',
    guardianName: 'Jordan Parent',
    membership: false,
    waiver: true,
  })
  assert.doesNotMatch(invite.html, /<script>/)
  assert.match(invite.text, /wants to join UNLV Mountain Club trips/)
  const code = guardianCodeEmail({
    siteUrl,
    code: '012345',
    participantName: 'Riley',
  })
  assert.match(code.subject, /^012345 /)
  assert.match(code.html, /does not verify your legal identity/)
  const signed = guardianSignedEmail({
    siteUrl,
    recordLink: `${siteUrl}/guardian/rec`,
    participantName: 'Riley Nakamura',
    guardianName: 'Jordan Parent',
    membership: true,
    waiver: true,
    validUntil: 'March 17, 2027 (the day before Riley turns 18)',
    approved: false,
  })
  assert.match(signed.text, /Valid through: March 17, 2027/)
  for (const kind of [
    'signed_review',
    'signed_accepted',
    'approved',
    'rejected',
    'clarification',
    'declined',
    'withdrawn',
  ]) {
    const notice = participantNoticeEmail({ siteUrl, kind })
    assert.doesNotMatch(notice.text, /allerg|medical|asthma|address/i, kind)
    assert.match(notice.text, /\/profile\/events\/guardian/)
  }
})
