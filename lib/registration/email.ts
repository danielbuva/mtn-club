import { z } from 'zod'

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
const messages: Record<string, string> = {
  confirmed: 'Your place on this trip is confirmed.',
  waitlisted:
    'You are on the waitlist. An organizer will choose participants when seats become available.',
  offered:
    'An organizer has offered you a reserved seat. Open your registration to accept before the offer expires.',
  offer_expired:
    'Your seat offer expired. You are back on the waitlist for organizer review.',
  cancelled:
    'Your registration has been canceled and any reserved seat released.',
  removed_by_organizer:
    'An organizer has removed your registration. Contact the trip organizer for details.',
  offer_revoked:
    'An organizer revoked your seat offer. Check your registration for the current status.',
  trip_canceled:
    'This trip has been canceled. Check the trip page for updates.',
  trip_changed:
    'The trip time or location has changed. Review the latest trip details before traveling.',
  reminder:
    'Your trip starts within 24 hours. Review the latest arrangements and your registration details.',
}
const escapeHtml = (value: string) =>
  value.replace(
    /[&<>"']/g,
    character =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[
        character
      ] ?? character,
  )
export function registrationEmail(
  notification: RegistrationNotification,
  siteUrl: string,
) {
  const origin = new URL(siteUrl)
  if (origin.protocol !== 'https:' && origin.hostname !== 'localhost')
    throw new Error('Invalid registration site URL')
  const link = new URL(`/trips/${notification.tripId}/rsvp`, origin).href
  const message =
    messages[notification.kind] ??
    'Your registration has been updated. Check the app for details.'
  const deadline = notification.offerExpiresAt
    ? `Offer expires: ${new Date(notification.offerExpiresAt).toLocaleString('en-US', { timeZone: notification.timeZone })} (${notification.timeZone}).`
    : ''
  const text = `UNLV Mountain Club\n\n${notification.title}\n\n${message}\n${deadline}\n\nReview registration: ${link}\n\nManage email preferences in your account settings.`
  const html = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fff9eb;color:#211d18;font-family:Arial,sans-serif"><tr><td style="padding:32px"><p>UNLV Mountain Club</p><h1 style="font-size:24px">${escapeHtml(notification.title)}</h1><p>${escapeHtml(message)}</p><p>${escapeHtml(deadline)}</p><p><a href="${escapeHtml(link)}">Review registration</a></p><p style="font-size:12px">Manage email preferences in your account settings.</p></td></tr></table>`
  return {
    subject: `${notification.kind === 'offered' ? 'Seat offer' : 'Trip update'}: ${notification.title.replace(/[\r\n]/g, ' ').slice(0, 150)}`,
    text,
    html,
  }
}
