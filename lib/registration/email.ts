import { z } from 'zod'
import { DISCORD_INVITE_URL } from '../constants.ts'
import {
  button,
  callout,
  details,
  escapeHtml,
  finePrint,
  paragraph,
  renderEmail,
  statusTag,
} from '../email/layout.ts'
import { fallbackCopy, notificationCopy } from './email-copy.ts'

export const notificationSchema = z.object({
  id: z.string().uuid(),
  tripId: z.string().uuid(),
  title: z.string(),
  kind: z.string(),
  email: z.string().email(),
  startAt: z.string(),
  timeZone: z.string(),
  offerExpiresAt: z.string().nullable(),
})
export type RegistrationNotification = z.infer<typeof notificationSchema>
// Non-breaking spaces keep "7:00 AM PST" together on narrow screens.
const formatTime = (iso: string, timeZone: string) =>
  new Date(iso)
    .toLocaleString('en-US', {
      timeZone,
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short',
    })
    .replace(/\s+(?=(?:AM|PM|[A-Z]{2,5})\b|\d{1,2},)/g, '\u00a0')
const footerLink = 'color:#6A5146;text-decoration:underline'
export function registrationEmail(
  notification: RegistrationNotification,
  siteUrl: string,
) {
  const origin = new URL(siteUrl)
  if (origin.protocol !== 'https:' && origin.hostname !== 'localhost')
    throw new Error('Invalid registration site URL')
  const opening = notification.kind === 'registration_opened'
  const copy = notificationCopy[notification.kind] ?? fallbackCopy
  const paths = {
    trip: `/trips/${notification.tripId}`,
    registration: `/trips/${notification.tripId}/rsvp`,
    trips: '/trips',
  } as const
  const link = new URL(paths[copy.target], origin).href
  const preferencesLink = new URL('/profile/user/privacy', origin).href
  const when = formatTime(notification.startAt, notification.timeZone)
  const deadline = notification.offerExpiresAt
    ? formatTime(notification.offerExpiresAt, notification.timeZone)
    : null
  const text = `UNLV Mountain Club\n\n${copy.heading}\n${notification.title}\nWhen: ${when}\nStatus: ${copy.status}${deadline ? `\nClaim by: ${deadline}` : ''}\nTime zone: ${notification.timeZone}\n\n${copy.message}\n\n${copy.action}: ${link}\n\nManage email preferences: ${preferencesLink}`
  const title = escapeHtml(notification.title)
  const discord = DISCORD_INVITE_URL
    ? `<a href="${escapeHtml(DISCORD_INVITE_URL)}" style="color:#211D18;text-decoration:underline">club Discord</a>`
    : 'club Discord'
  const html = renderEmail({
    title: copy.heading,
    preheader: deadline
      ? `Claim by ${escapeHtml(deadline)} · ${title}`
      : `${title} · ${escapeHtml(when)} · ${escapeHtml(copy.status)}`,
    eyebrow: opening ? 'Trip sign-ups' : 'Your trip registration',
    heading: copy.heading,
    content: [
      paragraph(escapeHtml(copy.message)),
      deadline ? callout('Claim by', escapeHtml(deadline)) : '',
      details([
        { label: 'Trip', value: title, emphasis: true },
        { label: 'When', value: escapeHtml(when) },
        { label: 'Status', value: statusTag(copy.status, copy.tone) },
      ]),
      button(escapeHtml(link), copy.action),
      finePrint(
        copy.target === 'trips'
          ? `Questions? Ask in the ${discord}.`
          : `Questions about the trip? Ask in the ${discord} or message your trip leader.`,
      ),
    ]
      .filter(Boolean)
      .join('\n'),
    reason: opening
      ? 'You’re getting this because you asked to hear when sign-ups open for club trips.'
      : 'You’re getting this because you registered for this trip.',
    footerLinks: `<a href="${escapeHtml(preferencesLink)}" style="${footerLink}">Manage email preferences</a> &middot; <a href="${escapeHtml(origin.origin)}" style="${footerLink}">unlvmountainclub.com</a> &middot; <a href="mailto:unlvmountainclub@gmail.com" style="${footerLink}">Email us</a>`,
    siteUrl: origin.origin,
  })
  return {
    subject: `${opening ? 'Registration open' : notification.kind === 'offered' ? 'Seat offer' : 'Trip update'}: ${notification.title.replace(/[\r\n]/g, ' ').slice(0, 150)}`,
    text,
    html,
  }
}
