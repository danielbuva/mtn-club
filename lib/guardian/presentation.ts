import type { GuardianStatus, TripGuardianState } from './schema'

export type GuardianTone =
  | 'ready'
  | 'action'
  | 'waiting'
  | 'review'
  | 'inactive'
  | 'stopped'

export type GuardianPresentation = {
  label: string
  tone: GuardianTone
  headline: string
  body: string
  /** A message from a club officer, shown quoted and attributed. */
  clubNote?: string
  /** Offer a way to email the club (the next step needs an officer). */
  contactClub?: boolean
  /** True when the participant can start or resend a guardian request. */
  canRequest: boolean
}

export type GuardianContext = 'trip' | 'profile'

export function waiverDate(value: string): string {
  return new Date(`${value}T12:00:00Z`).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

/**
 * One phrase for how long coverage lasts. A guardian's signature ends the day
 * before the participant turns 18, which can be earlier than June 30.
 */
export function coverageEnd(
  validUntil: string,
  waiverUntil?: string | null,
): string {
  return waiverUntil && validUntil < waiverUntil
    ? `${waiverDate(validUntil)} (the day before you turn 18)`
    : waiverDate(validUntil)
}

/** What the participant sees. Signing, club approval, and registration stay distinct. */
export function tripGuardianPresentation(
  state: TripGuardianState,
  status: Pick<GuardianStatus, 'lastOutcome' | 'tripCoverage' | 'waiver'>,
  context: GuardianContext = 'trip',
): GuardianPresentation {
  const waiverUntil = status.tripCoverage?.until ?? status.waiver.current?.until
  const until = status.waiver.validUntil
  const outcome = status.lastOutcome
  const onTrip = context === 'trip'
  switch (state) {
    case 'covered':
      return {
        label: 'Covered',
        tone: 'ready',
        headline: 'You’re covered.',
        body: onTrip
          ? `Your guardian’s waiver covers this trip${until ? `, through ${coverageEnd(until, waiverUntil)}` : ''}. Finish registering to hold a seat.`
          : `Your guardian’s waiver covers every listed activity${until ? ` through ${coverageEnd(until, waiverUntil)}` : ''}. You still register for each trip.`,
        canRequest: false,
      }
    case 'awaiting_review':
      return {
        label: 'Club review',
        tone: 'review',
        headline: 'Your guardian signed.',
        body: onTrip
          ? 'A club officer reviews it next. You can finish registering once it’s approved; we’ll email you. Your answers here are saved.'
          : 'A club officer reviews it next, usually within a few days. We’ll email you when it’s done.',
        canRequest: false,
      }
    case 'waiting_for_guardian':
      return {
        label: 'Link sent',
        tone: 'waiting',
        headline: 'Waiting on your guardian.',
        body: onTrip
          ? 'We emailed them a link. Your answers here are saved. You can finish registering once they sign and the club approves.'
          : 'We emailed them a link. Nothing else to do until they sign.',
        canRequest: true,
      }
    case 'out_of_scope':
      return {
        label: 'Extra waiver needed',
        tone: 'action',
        headline: 'This trip needs a different waiver.',
        body: 'This trip includes an activity the annual waiver doesn’t cover. Email the club to set up the separate waiver.',
        contactClub: true,
        canRequest: false,
      }
    case 'expired':
      return {
        label: 'Waiver expired',
        tone: 'action',
        headline: 'Your waiver has expired.',
        body: 'Annual waivers run July 1 to June 30. Your guardian needs to sign this year’s waiver.',
        canRequest: true,
      }
    case 'updated':
      return {
        label: 'New version',
        tone: 'action',
        headline: 'The waiver was updated.',
        body: 'The club published a new waiver version. Your guardian needs to read and sign it.',
        canRequest: true,
      }
    case 'withdrawn':
      return {
        label: 'Withdrawn',
        tone: 'stopped',
        headline: 'Permission was withdrawn.',
        body: 'Your guardian withdrew permission for future activities. A new guardian signature is needed.',
        canRequest: true,
      }
    case 'aged_out':
      return {
        label: 'Sign as an adult',
        tone: 'action',
        headline: 'You’re 18 now.',
        body: 'Your guardian’s waiver ended on your birthday. Email the club to update your age, then sign the adult waiver yourself.',
        contactClub: true,
        canRequest: false,
      }
    case 'risks_pending':
    case 'not_published':
      return {
        label: 'Not ready yet',
        tone: 'inactive',
        headline: 'Hang tight.',
        body:
          state === 'risks_pending'
            ? 'The organizer is still finishing this trip’s details. Check back soon.'
            : 'The club hasn’t published this year’s waiver yet. Check back soon.',
        canRequest: false,
      }
    case 'legacy':
      return {
        label: 'Officer review',
        tone: 'action',
        headline: 'An officer confirms this trip.',
        body: 'This trip uses its own waiver. Email the club to confirm guardian consent.',
        contactClub: true,
        canRequest: false,
      }
    case 'needs_signature':
      if (outcome?.decision === 'clarification')
        return {
          label: 'Needs info',
          tone: 'action',
          headline: 'The club has a question.',
          body: 'Send your guardian a new link. They can update their answers and sign again.',
          clubNote: outcome.reason ?? undefined,
          canRequest: true,
        }
      if (outcome?.decision === 'rejected')
        return {
          label: 'Not approved',
          tone: 'stopped',
          headline: 'We couldn’t approve it.',
          body: 'Fix what the club mentioned, then send your guardian a new link.',
          clubNote: outcome.reason ?? undefined,
          canRequest: true,
        }
      if (outcome?.status === 'declined')
        return {
          label: 'Not signed',
          tone: 'stopped',
          headline: 'Your guardian didn’t sign.',
          body: 'They chose not to sign. Talk with them, then send a new link when you’re ready.',
          canRequest: true,
        }
      return {
        label: 'Needs guardian',
        tone: 'action',
        headline: 'A parent or guardian signs for you.',
        body: 'You’re under 18, so a parent or legal guardian signs the club waiver. They sign once for the whole waiver year.',
        canRequest: true,
      }
    default: {
      const unreachable: never = state
      return unreachable
    }
  }
}

/** Profile-level waiver state uses the same words, without trip-specific lines. */
export function waiverGuardianPresentation(
  status: GuardianStatus,
): GuardianPresentation {
  const state = status.waiver.state
  if (state === 'needs_signature' && status.request?.inviteSentAt)
    return tripGuardianPresentation('waiting_for_guardian', status, 'profile')
  return tripGuardianPresentation(state, status, 'profile')
}

export function membershipPresentation(
  state: GuardianStatus['membership'],
): { label: string; tone: GuardianTone; body: string } | null {
  switch (state) {
    case 'not_applicable':
      return null
    case 'confirmed':
      return {
        label: 'Approved',
        tone: 'ready',
        body: 'Your guardian’s membership permission is on file.',
      }
    case 'awaiting_review':
      return {
        label: 'Club review',
        tone: 'review',
        body: 'Your guardian signed. An officer confirms it with your membership review.',
      }
    case 'needs_signature':
      return {
        label: 'Needs guardian',
        tone: 'action',
        body: 'Membership also needs your guardian’s permission. They can sign it in the same visit.',
      }
    default: {
      const unreachable: never = state
      return unreachable
    }
  }
}
