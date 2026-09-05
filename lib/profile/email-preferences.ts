import { z } from 'zod'

export const emailPreferencesSchema = z
  .object({
    email: z.boolean(),
    tripUpdates: z.boolean(),
    tripReminders: z.boolean(),
    announcements: z.boolean(),
    general: z.boolean(),
    memberStories: z.boolean(),
    safetyAlerts: z.boolean(),
  })
  .strict()
export type EmailPreferences = z.infer<typeof emailPreferencesSchema>
export const emailCategories = [
  {
    key: 'email',
    label: 'Allow club emails',
    description:
      'Turn off all optional club email. Sign-in, account security, and payment receipts are handled separately.',
  },
  {
    key: 'tripUpdates',
    label: 'Trips I RSVP for',
    description:
      'Registration confirmations, waitlist status, seat offers, cancellations, and organizer updates for your trips. On by default.',
  },
  {
    key: 'tripReminders',
    label: 'Upcoming trip reminders',
    description:
      'A reminder about 24 hours before a trip you are confirmed for. On by default.',
  },
  {
    key: 'safetyAlerts',
    label: 'Trip schedule and safety changes',
    description:
      'Time, location, and cancellation notices for trips you RSVP for. On by default.',
  },
  {
    key: 'announcements',
    label: 'Club announcements',
    description: 'New trips, club events, and club-wide news. Opt-in.',
  },
  {
    key: 'general',
    label: 'General club updates',
    description:
      'Club resources, opportunities, and occasional community information. Opt-in.',
  },
  {
    key: 'memberStories',
    label: 'Member stories',
    description:
      'Trip reports, member spotlights, and community highlights. Opt-in.',
  },
] as const
