// Guardian consent emails. Plain data in, { subject, html, text } out.
// Never include medical, emergency, or address details here.
import {
  button,
  codeBlock,
  details,
  escapeHtml,
  finePrint,
  linkFallback,
  paragraph,
  renderEmail,
  type StatusTone,
  statusTag,
} from '../email/layout.ts'

export type GuardianMessage = { subject: string; html: string; text: string }

const firstName = (name: string) => name.trim().split(/\s+/)[0] || name

function documentsLabel(membership: boolean, waiver: boolean) {
  if (membership && waiver)
    return 'Membership permission and annual activity waiver'
  return membership ? 'Membership permission' : 'Annual activity waiver'
}

export function guardianInviteEmail(input: {
  siteUrl: string
  link: string
  participantName: string
  guardianName: string
  membership: boolean
  waiver: boolean
}): GuardianMessage {
  const who = escapeHtml(input.participantName)
  const first = escapeHtml(firstName(input.participantName))
  const what = documentsLabel(input.membership, input.waiver)
  const subject = `${firstName(input.participantName)} needs your permission for UNLV Mountain Club`
  const html = renderEmail({
    title: subject,
    preheader: 'About 5 minutes on your phone. No account needed.',
    eyebrow: 'For parents & guardians',
    heading: `${first} needs your OK.`,
    content: [
      paragraph(
        `Hi ${escapeHtml(firstName(input.guardianName))}, ${who} ${input.membership ? 'is joining UNLV Mountain Club' : 'wants to join UNLV Mountain Club trips'} and is under 18, so a parent or legal guardian has to sign for them.`,
      ),
      details([
        { label: 'For', value: who, emphasis: true },
        { label: 'Sign', value: escapeHtml(what) },
        { label: 'Time', value: 'About 5 minutes' },
      ]),
      button(escapeHtml(input.link), 'Review and sign'),
      finePrint(
        'No account needed. We’ll email you a 6-digit code to confirm this address before you sign. The link works for 14 days.',
      ),
      linkFallback(escapeHtml(input.link)),
    ].join(''),
    reason: `${who} entered this address as their parent or guardian. If that isn’t you, you can ignore this email.`,
    siteUrl: input.siteUrl,
  })
  const text = `UNLV Mountain Club — for parents & guardians\n\n${firstName(input.participantName)} needs your OK.\n\n${input.participantName} ${input.membership ? 'is joining UNLV Mountain Club' : 'wants to join UNLV Mountain Club trips'} and is under 18, so a parent or legal guardian has to sign for them.\n\nSign: ${what}\nTime: about 5 minutes\n\nReview and sign: ${input.link}\n\nNo account needed. We'll email you a 6-digit code to confirm this address before you sign. The link works for 14 days.\n\nIf you aren't ${input.participantName}'s parent or guardian, ignore this email.`
  return { subject, html, text }
}

export function guardianCodeEmail(input: {
  siteUrl: string
  code: string
  participantName: string
}): GuardianMessage {
  const subject = `${input.code} is your Mountain Club signing code`
  const who = escapeHtml(input.participantName)
  const html = renderEmail({
    title: 'Your signing code',
    preheader: 'It expires in 10 minutes.',
    eyebrow: 'Confirm your email',
    heading: 'Your signing code',
    content: [
      paragraph(
        `Enter this code to confirm your email before signing for ${who}.`,
      ),
      codeBlock(escapeHtml(input.code)),
      finePrint(
        'It expires in 10 minutes. This confirms you can open this inbox; it does not verify your legal identity. Club officers review guardian details separately.',
      ),
    ].join(''),
    reason:
      'Someone entered this address on a UNLV Mountain Club guardian signing page. If it wasn’t you, ignore this email; nothing is signed without the code.',
    siteUrl: input.siteUrl,
  })
  const text = `UNLV Mountain Club\n\nYour signing code: ${input.code}\n\nEnter it to confirm your email before signing for ${input.participantName}. It expires in 10 minutes.\n\nIf you didn't ask for this, ignore this email. Nothing is signed without the code.`
  return { subject, html, text }
}

export function guardianSignedEmail(input: {
  siteUrl: string
  recordLink: string
  participantName: string
  guardianName: string
  membership: boolean
  waiver: boolean
  validUntil: string | null
  approved: boolean
}): GuardianMessage {
  const who = escapeHtml(input.participantName)
  const what = documentsLabel(input.membership, input.waiver)
  const subject = `Signed: ${what.toLowerCase()} for ${firstName(input.participantName)}`
  const next = input.approved
    ? `The club already verified you, so you’re done. ${firstName(input.participantName)} still registers for each trip. You won’t be asked again for covered trips while this stays valid.`
    : 'A club officer reviews new guardian signatures, usually within a few days. We’ll let you know if we need anything.'
  const html = renderEmail({
    title: subject,
    preheader: input.approved
      ? 'Accepted. You’re all set.'
      : 'A club officer will review it next.',
    eyebrow: 'Guardian permission',
    heading: 'Thanks. It’s signed.',
    content: [
      paragraph(escapeHtml(next)),
      details([
        { label: 'For', value: who, emphasis: true },
        { label: 'Signed', value: escapeHtml(what) },
        { label: 'By', value: escapeHtml(input.guardianName) },
        ...(input.validUntil
          ? [
              {
                label: 'Valid',
                value: `Through ${escapeHtml(input.validUntil)}`,
              },
            ]
          : []),
        {
          label: 'Status',
          value: statusTag(
            input.approved ? 'Accepted' : 'Club review',
            input.approved ? 'positive' : 'pending',
          ),
        },
      ]),
      button(escapeHtml(input.recordLink), 'View your copy'),
      finePrint(
        'Use the same link to download a copy or withdraw permission for future activities. We’ll ask for a fresh email code each time.',
      ),
    ].join(''),
    reason: `You signed as ${who}’s parent or legal guardian. Keep this email for your records.`,
    siteUrl: input.siteUrl,
  })
  const text = `UNLV Mountain Club\n\nThanks. It's signed.\n\n${next}\n\nFor: ${input.participantName}\nSigned: ${what}\nBy: ${input.guardianName}${input.validUntil ? `\nValid through: ${input.validUntil}` : ''}\n\nView, download, or withdraw: ${input.recordLink}`
  return { subject, html, text }
}

export type ParticipantNotice =
  | 'signed_review'
  | 'signed_accepted'
  | 'approved'
  | 'rejected'
  | 'clarification'
  | 'declined'
  | 'withdrawn'

const noticeCopy: Record<
  ParticipantNotice,
  {
    subject: string
    heading: string
    message: string
    tag: string
    tone: StatusTone
  }
> = {
  signed_review: {
    subject: 'Your guardian signed',
    heading: 'Your guardian signed.',
    message:
      'A club officer reviews it next. You can finish your trip registration once it’s approved.',
    tag: 'Club review',
    tone: 'pending',
  },
  signed_accepted: {
    subject: 'Your guardian signed — you’re covered',
    heading: 'You’re covered.',
    message:
      'Your guardian signed and the club already had their details on file. Head back and finish registering.',
    tag: 'Accepted',
    tone: 'positive',
  },
  approved: {
    subject: 'Guardian permission approved',
    heading: 'You’re covered.',
    message:
      'A club officer approved your guardian’s signature. Head back and finish registering.',
    tag: 'Approved',
    tone: 'positive',
  },
  rejected: {
    subject: 'Guardian permission not approved',
    heading: 'We couldn’t approve it.',
    message:
      'A club officer couldn’t approve your guardian’s signature. Open your profile to see why and start a new request.',
    tag: 'Not approved',
    tone: 'negative',
  },
  clarification: {
    subject: 'The club needs a little more from your guardian',
    heading: 'One more thing.',
    message:
      'A club officer has a question about your guardian’s signature. Open your profile to see what’s needed.',
    tag: 'Needs info',
    tone: 'pending',
  },
  declined: {
    subject: 'Your guardian didn’t sign',
    heading: 'Your guardian didn’t sign.',
    message:
      'Your guardian chose not to sign right now. Talk with them, then send a new request when you’re ready.',
    tag: 'Not signed',
    tone: 'negative',
  },
  withdrawn: {
    subject: 'Your guardian withdrew permission',
    heading: 'Permission withdrawn.',
    message:
      'Your guardian withdrew permission for future activities. You’ll need a new signature before your next covered trip.',
    tag: 'Withdrawn',
    tone: 'negative',
  },
}

export function participantNoticeEmail(input: {
  siteUrl: string
  kind: ParticipantNotice
}): GuardianMessage {
  const copy = noticeCopy[input.kind]
  const link = new URL('/profile/events/guardian', input.siteUrl).href
  const html = renderEmail({
    title: copy.subject,
    preheader: copy.message,
    eyebrow: 'Guardian permission',
    heading: copy.heading,
    content: [
      paragraph(escapeHtml(copy.message)),
      details([{ label: 'Status', value: statusTag(copy.tag, copy.tone) }]),
      button(escapeHtml(link), 'Open guardian permission'),
    ].join(''),
    reason:
      'You asked a parent or guardian to sign for your UNLV Mountain Club account.',
    siteUrl: input.siteUrl,
  })
  const text = `UNLV Mountain Club\n\n${copy.heading}\n\n${copy.message}\n\nStatus: ${copy.tag}\n\nOpen guardian permission: ${link}`
  return { subject: copy.subject, html, text }
}
