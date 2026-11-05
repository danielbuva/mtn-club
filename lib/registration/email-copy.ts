import type { StatusTone } from '../email/blocks.ts'

export type NotificationCopy = {
  heading: string
  /** Shown in the email body and the plain-text part. */
  message: string
  status: string
  tone: StatusTone
  action: string
  /** Where the primary button goes. */
  target: 'trip' | 'registration' | 'trips'
}

export const notificationCopy: Record<string, NotificationCopy> = {
  registration_opened: {
    heading: 'Sign-ups are open.',
    message:
      'Registration is now open for this trip. Grab a spot while places are available.',
    status: 'Open',
    tone: 'positive',
    action: 'View trip and register',
    target: 'trip',
  },
  confirmed: {
    heading: 'You’re going.',
    message:
      'Open your registration for meetup details. Can’t make it after all? Cancel there so someone on the waitlist can take your seat.',
    status: 'Confirmed',
    tone: 'positive',
    action: 'View my registration',
    target: 'registration',
  },
  waitlisted: {
    heading: 'You’re on the waitlist.',
    message:
      'The trip is full for now. An organizer will pick participants as seats open up, and we’ll email you if one is offered.',
    status: 'Waitlisted',
    tone: 'pending',
    action: 'View my registration',
    target: 'registration',
  },
  offered: {
    heading: 'A seat is yours to claim.',
    message:
      'An organizer has offered you a reserved seat. Open your registration and accept it before the deadline, or it goes to the next person.',
    status: 'Seat offered',
    tone: 'positive',
    action: 'Claim my seat',
    target: 'registration',
  },
  offer_expired: {
    heading: 'Your seat offer expired.',
    message:
      'The deadline passed, so the seat moved on. You’re back on the waitlist for organizer review.',
    status: 'Waitlisted',
    tone: 'pending',
    action: 'View my registration',
    target: 'registration',
  },
  cancelled: {
    heading: 'Registration canceled.',
    message:
      'Your registration has been canceled and any reserved seat released.',
    status: 'Canceled',
    tone: 'negative',
    action: 'Browse upcoming trips',
    target: 'trips',
  },
  removed_by_organizer: {
    heading: 'You’re off this trip.',
    message:
      'An organizer removed your registration. Contact the trip organizer if you have questions.',
    status: 'Removed',
    tone: 'negative',
    action: 'View my registration',
    target: 'registration',
  },
  offer_revoked: {
    heading: 'Seat offer withdrawn.',
    message:
      'An organizer withdrew your seat offer. Check your registration for your current status.',
    status: 'Offer withdrawn',
    tone: 'negative',
    action: 'View my registration',
    target: 'registration',
  },
  trip_canceled: {
    heading: 'This trip is canceled.',
    message:
      'Sorry, this one won’t run. You don’t need to do anything — your registration is closed out for you.',
    status: 'Trip canceled',
    tone: 'negative',
    action: 'Browse upcoming trips',
    target: 'trips',
  },
  trip_changed: {
    heading: 'Trip details changed.',
    message:
      'The time or location changed. Review the latest details before you head out.',
    status: 'Updated',
    tone: 'pending',
    action: 'View my registration',
    target: 'registration',
  },
  incomplete_reminder: {
    heading: 'Finish your signup.',
    message:
      'Your trip starts within 24 hours, but your signup isn’t finished. Your place isn’t confirmed until it is.',
    status: 'Incomplete',
    tone: 'pending',
    action: 'Finish signup',
    target: 'registration',
  },
  reminder: {
    heading: 'Your trip is almost here.',
    message:
      'Your trip starts within 24 hours. Give the latest arrangements and your registration one last look.',
    status: 'Confirmed',
    tone: 'positive',
    action: 'View my registration',
    target: 'registration',
  },
}

export const fallbackCopy: NotificationCopy = {
  heading: 'Your registration changed.',
  message: 'Your registration has been updated. Check the app for details.',
  status: 'Updated',
  tone: 'pending',
  action: 'View my registration',
  target: 'registration',
}
