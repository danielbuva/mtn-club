// Supabase Auth email bodies. Supabase fills the Go-template placeholders;
// regenerate supabase/templates with `node scripts/build-auth-emails.ts`.

import {
  type AuthTemplate,
  accountReason,
  contact,
  resetHref,
  site,
} from './auth-shared.ts'
import {
  button,
  codeBlock,
  finePrint,
  linkFallback,
  paragraph,
  renderEmail,
  secondaryButton,
} from './layout.ts'

export type { AuthTemplate } from './auth-shared.ts'

const confirmHref =
  '{{ .RedirectTo }}&amp;token_hash={{ .TokenHash }}&amp;type=signup'
const recoveryHref =
  '{{ .RedirectTo }}&amp;token_hash={{ .TokenHash }}&amp;type=recovery'

export const authTemplates: AuthTemplate[] = [
  {
    file: 'confirmation.html',
    subject: 'Confirm your Mountain Club email',
    html: renderEmail({
      title: 'Confirm your email',
      preheader:
        'One step left: confirm your email to finish setting up your account.',
      eyebrow: 'New account',
      heading: 'Welcome to the club.',
      content: [
        paragraph(
          'Confirm your email to finish setting up your account. After you click, tap <strong>Confirm and continue</strong> on the page that opens and you’ll land back where you started.',
        ),
        button(confirmHref, 'Confirm email'),
        finePrint(
          `This link works once and expires in 1 hour. Didn’t sign up? Ignore this email and no account will be activated. Questions? ${contact}.`,
        ),
        linkFallback(confirmHref),
      ].join('\n'),
      reason:
        'You’re getting this because someone signed up for UNLV Mountain Club with {{ .Email }}.',
      siteUrl: site,
    }),
  },
  {
    file: 'recovery.html',
    subject: 'Reset your Mountain Club password',
    html: renderEmail({
      title: 'Reset your password',
      preheader:
        'Use this one-time link within the hour to choose a new password.',
      eyebrow: 'Password reset',
      heading: 'Reset your password.',
      content: [
        paragraph(
          'We got a request to reset the password for your Mountain Club account. Click below, then tap <strong>Continue to new password</strong> on the page that opens to choose a new one.',
        ),
        button(recoveryHref, 'Reset password'),
        finePrint(
          `This link works once and expires in 1 hour. Didn’t ask for this? Ignore this email and your password stays the same. Worried? ${contact}.`,
        ),
        linkFallback(recoveryHref),
      ].join('\n'),
      reason: accountReason,
      siteUrl: site,
    }),
  },
  {
    file: 'verification-code.html',
    subject: 'Your Mountain Club verification code',
    html: renderEmail({
      title: 'Your verification code',
      preheader:
        '{{ .Token }} is your Mountain Club code. It expires in 1 hour.',
      eyebrow: 'Email verification',
      heading: 'Here’s your code.',
      content: [
        paragraph(
          'Enter this code in Account settings to verify your email address.',
        ),
        codeBlock('{{ .Token }}'),
        finePrint(
          'It works once and expires in 1 hour. Never share it, not even with club officers. We’ll never ask for it.',
        ),
        finePrint(
          `Verifying is optional and doesn’t change your membership or access. Didn’t request a code? Ignore this email, or ${contact}.`,
        ),
      ].join('\n'),
      reason: accountReason,
      siteUrl: site,
    }),
  },
  {
    file: 'password-changed.html',
    subject: 'Your Mountain Club password was changed',
    html: renderEmail({
      title: 'Your password was changed',
      preheader:
        'If this was you, you’re all set. If not, secure your account now.',
      eyebrow: 'Security notice',
      heading: 'Password changed.',
      content: [
        paragraph(
          'The password for your Mountain Club account was just changed. If this was you, you’re all set and there’s nothing else to do.',
        ),
        paragraph(
          '<strong>Wasn’t you?</strong> Reset your password right away to lock out whoever changed it.',
        ),
        secondaryButton(resetHref, 'Secure my account'),
        finePrint(
          `Then ${contact} so we can check your account and trip registrations.`,
        ),
      ].join('\n'),
      reason: accountReason,
      siteUrl: site,
    }),
  },
]
