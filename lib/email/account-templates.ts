// Less common Supabase Auth emails: invites, email changes, reauthentication,
// and security notices. Same shell and voice as auth-templates.ts.
import {
  type AuthTemplate,
  accountReason,
  confirmLink,
  contact,
  resetHref,
  site,
} from './auth-shared.ts'
import {
  button,
  codeBlock,
  type DetailRow,
  details,
  finePrint,
  linkFallback,
  paragraph,
  renderEmail,
  secondaryButton,
} from './layout.ts'

const inviteHref = confirmLink('invite')
const emailChangeHref = confirmLink('email_change')

/** A security notice: what changed, and one clear path if it wasn't them. */
function securityNotice(input: {
  file: string
  subject: string
  heading: string
  preheader: string
  summary: string
  rows: DetailRow[]
  /** "Wasn't you?" guidance; defaults to resetting the password. */
  advice?: string
  action?: { href: string; label: string }
  reason?: string
  followUp?: string
}): AuthTemplate {
  const action = input.action ?? { href: resetHref, label: 'Secure my account' }
  return {
    file: input.file,
    subject: input.subject,
    html: renderEmail({
      title: input.subject,
      preheader: input.preheader,
      eyebrow: 'Security notice',
      heading: input.heading,
      content: [
        paragraph(input.summary),
        details(input.rows),
        paragraph(
          `<strong>Wasn’t you?</strong> ${input.advice ?? 'Reset your password right away to lock out whoever made the change.'}`,
        ),
        secondaryButton(action.href, action.label),
        finePrint(
          input.followUp ??
            `Then ${contact} so we can check your account and trip registrations.`,
        ),
      ].join('\n'),
      reason: input.reason ?? accountReason,
      siteUrl: site,
    }),
  }
}

export const accountTemplates: AuthTemplate[] = [
  {
    file: 'invite.html',
    subject: 'You’re invited to UNLV Mountain Club',
    html: renderEmail({
      title: 'You’re invited',
      preheader:
        'Accept your invite and set a password to join the club online.',
      eyebrow: 'Invitation',
      heading: 'You’re invited.',
      content: [
        paragraph(
          'A club officer set up a UNLV Mountain Club account for you. Accept the invite, then tap <strong>Continue to new password</strong> on the page that opens to choose your password.',
        ),
        button(inviteHref, 'Accept invite'),
        finePrint(
          `This link works once and expires in 1 hour. Not expecting this? Ignore this email and nothing happens. Questions? ${contact}.`,
        ),
        linkFallback(inviteHref),
      ].join('\n'),
      reason:
        'You’re getting this because a club officer invited {{ .Email }} to UNLV Mountain Club.',
      siteUrl: site,
    }),
  },
  {
    file: 'email-change.html',
    subject: 'Confirm your new Mountain Club email',
    html: renderEmail({
      title: 'Confirm your new email',
      preheader:
        'Confirm this change to start using {{ .NewEmail }} for your account.',
      eyebrow: 'Email change',
      heading: 'Confirm the change.',
      content: [
        paragraph(
          'Someone asked to change the email on your Mountain Club account. Confirm below, then tap <strong>Confirm and continue</strong> on the page that opens.',
        ),
        details([
          { label: 'From', value: '{{ .Email }}' },
          { label: 'To', value: '{{ .NewEmail }}' },
        ]),
        button(emailChangeHref, 'Confirm new email'),
        finePrint(
          `This link works once and expires in 1 hour. Didn’t ask for this? Ignore this email and your address stays the same. Worried? ${contact}.`,
        ),
        linkFallback(emailChangeHref),
      ].join('\n'),
      reason:
        'You’re getting this because an email change was requested for your UNLV Mountain Club account.',
      siteUrl: site,
    }),
  },
  {
    file: 'reauthentication.html',
    subject: 'Your Mountain Club confirmation code',
    html: renderEmail({
      title: 'Confirm it’s you',
      preheader:
        '{{ .Token }} is your code to confirm a sensitive account change.',
      eyebrow: 'Confirm it’s you',
      heading: 'Here’s your code.',
      content: [
        paragraph(
          'Enter this code to confirm a sensitive change to your account, like a new password.',
        ),
        codeBlock('{{ .Token }}'),
        finePrint(
          'It works once and expires in 1 hour. Never share it, not even with club officers. We’ll never ask for it.',
        ),
        finePrint(
          `Didn’t try to change anything? Someone may know your password. Reset it now, then ${contact}.`,
        ),
      ].join('\n'),
      reason: accountReason,
      siteUrl: site,
    }),
  },
  securityNotice({
    file: 'email-changed.html',
    subject: 'Your Mountain Club email was changed',
    heading: 'Email changed.',
    preheader:
      'Your account email is now {{ .Email }}. If this wasn’t you, act now.',
    summary:
      'The email address on your Mountain Club account was just changed. If this was you, you’re all set.',
    rows: [
      { label: 'Old', value: '{{ .OldEmail }}' },
      { label: 'New', value: '{{ .Email }}' },
    ],
    // Sent to the old address: a reset link would reach the new (possibly
    // attacker's) inbox, so the recovery path is the club itself.
    advice:
      'Email the club right away. We can restore your old address and lock the account.',
    action: {
      href: 'mailto:unlvmountainclub@gmail.com?subject=Email%20change%20I%20didn%27t%20make',
      label: 'Email the club',
    },
    followUp:
      'Include both addresses above so we can find the account quickly.',
    reason:
      'You’re getting this because {{ .OldEmail }} was the email on a UNLV Mountain Club account.',
  }),
  securityNotice({
    file: 'identity-linked.html',
    subject: 'A sign-in method was added to your account',
    heading: 'New sign-in method.',
    preheader:
      'Your {{ .Provider }} sign-in was connected. If this wasn’t you, act now.',
    summary:
      'A new way to sign in was connected to your Mountain Club account. If this was you, you’re all set.',
    rows: [{ label: 'Added', value: '{{ .Provider }}', capitalize: true }],
    advice:
      'Reset your password, then remove <span style="text-transform:capitalize">{{ .Provider }}</span> under Account settings → Sign-in methods.',
    action: {
      href: `${site}/profile/user/account#sign-in-methods`,
      label: 'Review sign-in methods',
    },
  }),
  securityNotice({
    file: 'identity-unlinked.html',
    subject: 'A sign-in method was removed from your account',
    heading: 'Sign-in method removed.',
    preheader:
      'Your {{ .Provider }} sign-in was disconnected. Wasn’t you? Act now.',
    summary:
      'A sign-in method was disconnected from your Mountain Club account. If this was you, you’re all set.',
    rows: [{ label: 'Removed', value: '{{ .Provider }}', capitalize: true }],
  }),
]
