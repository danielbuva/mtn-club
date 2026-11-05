// Resend dashboard templates for officer-sent broadcasts. Resend fills
// `{{{VAR}}}` (and `{{{RESEND_UNSUBSCRIBE_URL}}}` on broadcasts). Every slot
// in a variant is required; pick the variant that matches the content.
// Regenerate docs/email/resend/*.html with `node scripts/build-auth-emails.ts`.
import { type AnnouncementEmail, announcementHtml } from './announcement.ts'

export type ResendTemplate = {
  file: string
  name: string
  /** Shown as the template description in Resend: what to fill in. */
  guide: string
  html: string
}

const site = 'https://unlvmountainclub.com'
const links = {
  siteUrl: site,
  preferencesUrl: `${site}/profile/user/privacy`,
  unsubscribeUrl: '{{{RESEND_UNSUBSCRIBE_URL}}}',
  fluidButton: true,
}
const v = (name: string) => `{{{${name}}}}`
const shared = {
  title: v('TITLE'),
  preheader: v('PREHEADER'),
  intro: v('INTRO'),
  bodySlot: v('BODY'),
  cta: { label: v('BUTTON_LABEL'), href: v('BUTTON_URL') },
}
const photo = { src: v('PHOTO_URL'), alt: v('PHOTO_ALT') }
const stories = (count: number) =>
  Array.from({ length: count }, (_, i) => ({
    title: v(`STORY_${i + 1}_TITLE`),
    summary: v(`STORY_${i + 1}_SUMMARY`),
    href: v(`STORY_${i + 1}_URL`),
  }))

const headGuide =
  'TITLE ≤ 45 characters, no trailing period. PREHEADER ≤ 90 characters; add to the subject, don’t repeat TITLE. BUTTON_LABEL ≤ 22 characters.'
const baseGuide = `${headGuide} Separate BODY paragraphs with <br><br>.`
const digestGuide = `${headGuide} STORY_n_TITLE ≤ 40 characters, STORY_n_SUMMARY ≤ 120 characters.`
const photoGuide = 'PHOTO_URL: 1068×600 (16:9) JPEG under 200 KB.'

const templates: {
  file: string
  name: string
  guide: string
  email: AnnouncementEmail
}[] = [
  {
    file: 'club-announcement.html',
    name: 'Club announcement — with photo',
    guide: `${baseGuide} ${photoGuide}`,
    email: { kind: 'news', ...shared, photo },
  },
  {
    file: 'club-announcement-text.html',
    name: 'Club announcement — text only',
    guide: baseGuide,
    email: { kind: 'news', ...shared },
  },
  {
    file: 'new-trip.html',
    name: 'New trip announcement',
    guide: `${baseGuide} ${photoGuide} TRIP_LEVEL defaults to “All levels”, TRIP_COST to “Free”.`,
    email: {
      kind: 'trip',
      ...shared,
      photo,
      trip: {
        when: v('TRIP_WHEN'),
        where: v('TRIP_WHERE'),
        level: v('TRIP_LEVEL'),
        cost: v('TRIP_COST'),
      },
    },
  },
  {
    file: 'member-stories-2.html',
    name: 'Member stories — 2 stories',
    guide: `${digestGuide} Fill STORY_1_* and STORY_2_*.`,
    email: {
      kind: 'digest',
      ...shared,
      bodySlot: undefined,
      stories: stories(2),
    },
  },
  {
    file: 'member-stories.html',
    name: 'Member stories — 3 stories',
    guide: `${digestGuide} Fill STORY_1_* through STORY_3_*.`,
    email: {
      kind: 'digest',
      ...shared,
      bodySlot: undefined,
      stories: stories(3),
    },
  },
  {
    file: 'important-update.html',
    name: 'Important update — safety or schedule',
    guide: `${baseGuide} WHAT_CHANGED ≤ 160 characters. Send only to the trip’s attendees (trip-updates audience).`,
    email: {
      kind: 'alert',
      ...shared,
      alert: {
        change: v('WHAT_CHANGED'),
        trip: v('TRIP_NAME'),
        when: v('TRIP_WHEN'),
      },
    },
  },
]

export const resendTemplates: ResendTemplate[] = templates.map(t => ({
  file: t.file,
  name: t.name,
  guide: t.guide,
  html: announcementHtml(t.email, links),
}))
