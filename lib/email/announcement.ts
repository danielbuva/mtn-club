// Opt-in club mail: announcements, new trips, story digests, and alerts.
// Inputs are plain text and get escaped here; Resend `{{{VAR}}}`
// placeholders pass through unchanged (see lib/email/resend-templates.ts).
import {
  button,
  details,
  escapeHtml,
  fluidButton,
  image,
  notice,
  paragraph,
  renderEmail,
  richText,
  type StoryItem,
  storyList,
} from './layout.ts'

type Base = {
  title: string
  /** Inbox preview line; should add to the subject, not repeat it. */
  preheader: string
  intro: string
  body?: string[]
  /** Trusted HTML for a multi-paragraph template slot (Resend only). */
  bodySlot?: string
  photo?: { src: string; alt: string }
  cta?: { label: string; href: string }
}

export type AnnouncementEmail =
  | (Base & { kind: 'news' })
  | (Base & {
      kind: 'trip'
      trip: { when: string; where: string; level: string; cost: string }
    })
  | (Base & { kind: 'digest'; stories: StoryItem[] })
  | (Base & {
      kind: 'alert'
      alert: { change: string; trip: string; when: string }
    })

export type AnnouncementLinks = {
  siteUrl: string
  preferencesUrl: string
  unsubscribeUrl: string
  /** Label sizing is unknown for template variables: use a padded cell. */
  fluidButton?: boolean
}

const eyebrows = {
  news: 'Club news',
  trip: 'New trip',
  digest: 'Member stories',
  alert: 'Important update',
} as const

const footerLink = 'color:#6A5146;text-decoration:underline'

function kindBlocks(email: AnnouncementEmail): string {
  switch (email.kind) {
    case 'news':
      return ''
    case 'trip':
      return details([
        { label: 'When', value: escapeHtml(email.trip.when), emphasis: true },
        { label: 'Where', value: escapeHtml(email.trip.where) },
        { label: 'Level', value: escapeHtml(email.trip.level) },
        { label: 'Cost', value: escapeHtml(email.trip.cost) },
      ])
    case 'digest':
      return storyList(
        email.stories.map(story => ({
          title: escapeHtml(story.title),
          summary: escapeHtml(story.summary),
          href: escapeHtml(story.href),
        })),
      )
    case 'alert':
      return [
        notice('What changed', escapeHtml(email.alert.change)),
        details([
          { label: 'Trip', value: escapeHtml(email.alert.trip) },
          {
            label: 'When',
            value: escapeHtml(email.alert.when),
            emphasis: true,
          },
        ]),
      ].join('\n')
    default: {
      const unreachable: never = email
      return unreachable
    }
  }
}

export function announcementHtml(
  email: AnnouncementEmail,
  links: AnnouncementLinks,
): string {
  const cta = email.cta
    ? { href: escapeHtml(email.cta.href), label: escapeHtml(email.cta.label) }
    : null
  const alert = email.kind === 'alert'
  const content = [
    email.photo
      ? image(
          escapeHtml(email.photo.src),
          escapeHtml(email.photo.alt),
          cta?.href,
        )
      : '',
    // Match the 26px <br><br> rhythm inside a following BODY slot.
    paragraph(escapeHtml(email.intro), email.bodySlot ? 26 : 16),
    kindBlocks(email),
    ...(email.body ?? []).map(text => paragraph(escapeHtml(text))),
    email.bodySlot ? richText(email.bodySlot) : '',
    cta ? (links.fluidButton ? fluidButton : button)(cta.href, cta.label) : '',
  ]
  const unsubscribe = `<a href="${escapeHtml(links.unsubscribeUrl)}" style="${footerLink}">${alert ? 'Unsubscribe from trip updates' : 'Unsubscribe'}</a>`
  return renderEmail({
    title: escapeHtml(email.title),
    preheader: escapeHtml(email.preheader),
    eyebrow: eyebrows[email.kind],
    heading: escapeHtml(email.title),
    content: content.filter(Boolean).join('\n'),
    reason: alert
      ? 'You’re getting this because it affects a trip or event you signed up for. Unsubscribing from club news doesn’t stop these.'
      : 'You’re getting this because you opted in to UNLV Mountain Club emails.',
    footerLinks: `${unsubscribe} &middot; <a href="${escapeHtml(links.preferencesUrl)}" style="${footerLink}">Email preferences</a>${alert ? '' : ` &middot; <a href="${escapeHtml(links.siteUrl)}" style="${footerLink}">unlvmountainclub.com</a>`}`,
    siteUrl: escapeHtml(links.siteUrl),
    postalAddress: true,
    urgent: alert,
  })
}
