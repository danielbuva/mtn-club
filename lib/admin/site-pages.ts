import type { AdminCapability } from '@/lib/admin/constants'

/** The dashboard editors that feed public pages. */
export const PAGE_EDITORS = {
  trips: {
    capability: 'trips.update',
    href: '/admin/trips',
    action: 'Edit trips',
  },
  notices: {
    capability: 'announcements.manage',
    href: '/admin/announcements',
    action: 'Edit notices',
  },
  gallery: {
    capability: 'gallery.update',
    href: '/admin/gallery',
    action: 'Edit photos',
  },
  roster: {
    capability: 'leadership.read',
    href: '/admin/leadership',
    action: 'Edit roster',
  },
} as const satisfies Record<
  string,
  { capability: AdminCapability; href: string; action: string }
>

export type PageEditor = keyof typeof PAGE_EDITORS

/**
 * `assigned` is trips only: the admin can edit the trips they lead.
 * `view` can open the editor but not change anything.
 */
export type PageEditLevel = 'edit' | 'assigned' | 'view' | 'none'
export type PageEditAccess = Record<PageEditor, PageEditLevel>

export type SitePage = {
  path: string
  name: string
  /** What visitors find on the page, in a few words. */
  summary: string
  /** Null when the page's content is written in code. */
  editor: PageEditor | null
}

export const SITE_PAGES = [
  {
    path: '/',
    name: 'Home',
    summary: 'Cover, the current notice, and the next trips.',
    editor: 'notices',
  },
  {
    path: '/schedule',
    name: 'Schedule',
    summary: 'The public list of upcoming trips.',
    editor: 'trips',
  },
  {
    path: '/calendar',
    name: 'Calendar',
    summary: 'Month and list views of every trip.',
    editor: 'trips',
  },
  {
    path: '/trips',
    name: 'Trips',
    summary: 'The member trip list with sign-ups.',
    editor: 'trips',
  },
  {
    path: '/announcements',
    name: 'Announcements',
    summary: 'The noticeboard and its archive.',
    editor: 'notices',
  },
  {
    path: '/gallery',
    name: 'Gallery',
    summary: 'Published club photographs.',
    editor: 'gallery',
  },
  {
    path: '/team',
    name: 'Team',
    summary: 'The public leadership roster.',
    editor: 'roster',
  },
  {
    path: '/welcome',
    name: 'Welcome',
    summary: 'First stop for new visitors.',
    editor: null,
  },
  {
    path: '/join',
    name: 'Join',
    summary: 'How to become a member.',
    editor: null,
  },
  {
    path: '/membership',
    name: 'Membership',
    summary: 'Dues, benefits, and sign-up.',
    editor: null,
  },
  {
    path: '/about',
    name: 'About',
    summary: 'Who we are and what we do.',
    editor: null,
  },
  {
    path: '/learn-more',
    name: 'Learn more',
    summary: 'The guide for people new to the club.',
    editor: null,
  },
  {
    path: '/faq',
    name: 'FAQ',
    summary: 'Common questions, answered.',
    editor: null,
  },
  {
    path: '/gear',
    name: 'Gear',
    summary: 'What to bring and what we lend.',
    editor: null,
  },
  {
    path: '/safety',
    name: 'Safety',
    summary: 'Expectations on every trip.',
    editor: null,
  },
  {
    path: '/cost',
    name: 'Cost',
    summary: 'What trips and dues cost.',
    editor: null,
  },
  {
    path: '/privacy',
    name: 'Privacy',
    summary: 'The privacy policy.',
    editor: null,
  },
  {
    path: '/terms',
    name: 'Terms',
    summary: 'The terms of use.',
    editor: null,
  },
] as const satisfies readonly SitePage[]

export type CurrentSitePage =
  | { kind: 'page'; page: SitePage }
  | { kind: 'trip'; tripId: string }
  | { kind: 'notice'; slug: string }

const RESERVED_TRIP_SEGMENTS = new Set(['new', 'drafts'])

/** Which editable page a public pathname belongs to, if any. */
export function resolveSitePage(pathname: string): CurrentSitePage | null {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname
  const page = SITE_PAGES.find(item => item.path === path)
  if (page) return { kind: 'page', page }

  const [, section, id, ...rest] = path.split('/')
  if (!id || rest.length) return null
  if (section === 'trips' && !RESERVED_TRIP_SEGMENTS.has(id))
    return { kind: 'trip', tripId: id }
  if (section === 'announcements') return { kind: 'notice', slug: id }
  return null
}

/** Sends an editor back to the page the admin came from. */
export const withReturnTo = (href: string, returnTo: string) =>
  `${href}${href.includes('?') ? '&' : '?'}returnTo=${encodeURIComponent(returnTo)}`
