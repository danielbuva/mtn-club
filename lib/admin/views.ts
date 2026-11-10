export const ADMIN_VIEWS = {
  announcements: {
    title: 'Announcements',
    description: 'Write, schedule, and publish notices for the club.',
    publicPage: { href: '/announcements', label: 'View noticeboard' },
  },
  overview: {
    title: 'Welcome back',
    description: 'Club operations at a glance.',
  },
  pages: {
    title: 'Pages',
    description: 'Every public page, what feeds it, and where to change it.',
  },
  trips: {
    title: 'Trips',
    description:
      'Create, review, and maintain the club schedule without losing canceled-trip history.',
    publicPage: { href: '/schedule', label: 'View schedule' },
  },
  membership: {
    title: 'Membership',
    description:
      'Review applications, verify Zelle dues, and keep member access accurate.',
  },
  accounts: {
    title: 'Accounts',
    description:
      'Search members, inspect access, and manage account lifecycle safely.',
  },
  analytics: {
    title: 'Analytics',
    description:
      'Operational membership, dues, trip, and mailing-list signals from Supabase.',
  },
  mailing: {
    title: 'Mailing list',
    description:
      'Consent-backed subscriber records. Campaign sending is intentionally outside part one.',
  },
  gallery: {
    title: 'Club gallery',
    description:
      'Upload club photographs, write accessible descriptions, and publish the records ready for the public gallery.',
    publicPage: { href: '/gallery', label: 'View gallery' },
  },
  leadership: {
    title: 'Leadership & access',
    description:
      'Maintain the public roster and control exactly what each leadership role can do.',
    publicPage: { href: '/team', label: 'View team page' },
  },
  settings: {
    title: 'Settings',
    description:
      'The active club term and policies used by membership and community trips.',
  },
} as const satisfies Record<
  string,
  {
    title: string
    description: string
    /** The public page this view feeds, linked from the view's header. */
    publicPage?: { href: string; label: string }
  }
>

export type AdminView = keyof typeof ADMIN_VIEWS

export function adminViewForPath(pathname: string): AdminView {
  const segment = pathname.split('/')[2]
  if (segment === 'mailing-list') return 'mailing'
  if (segment && Object.hasOwn(ADMIN_VIEWS, segment))
    return segment as AdminView
  return 'overview'
}
