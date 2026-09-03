export const ADMIN_CAPABILITIES = [
  'overview.read',
  'trips.read',
  'trips.create',
  'trips.update',
  'trips.delete',
  'trips.official',
  'membership.read',
  'membership.update',
  'membership.confirm_payment',
  'membership.confirm_guardian',
  'accounts.read',
  'accounts.update',
  'analytics.read',
  'mailing_list.read',
  'mailing_list.export',
  'gallery.read',
  'gallery.create',
  'gallery.update',
  'gallery.delete',
  'leadership.read',
  'settings.read',
  'settings.update',
] as const

export type AdminCapability = (typeof ADMIN_CAPABILITIES)[number]

export const ADMIN_NAV_ITEMS = [
  { href: '/admin', label: 'Overview', capability: 'overview.read' },
  { href: '/admin/trips', label: 'Trips', capability: 'trips.read' },
  {
    href: '/admin/membership',
    label: 'Membership',
    capability: 'membership.read',
  },
  { href: '/admin/accounts', label: 'Accounts', capability: 'accounts.read' },
  {
    href: '/admin/analytics',
    label: 'Analytics',
    capability: 'analytics.read',
  },
  {
    href: '/admin/mailing-list',
    label: 'Mailing List',
    capability: 'mailing_list.read',
  },
  { href: '/admin/gallery', label: 'Gallery', capability: 'gallery.read' },
  {
    href: '/admin/leadership',
    label: 'Leadership & Access',
    capability: 'leadership.read',
  },
  { href: '/admin/settings', label: 'Settings', capability: 'settings.read' },
] as const satisfies ReadonlyArray<{
  href: string
  label: string
  capability: AdminCapability
}>
