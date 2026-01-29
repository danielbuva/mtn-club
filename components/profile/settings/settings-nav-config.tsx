export type SettingsNavItem = {
  label: string
  href: string
  description?: string
}

export type SettingsNavSection = {
  title: string
  items: SettingsNavItem[]
}

export const settingsNavSections: SettingsNavSection[] = [
  {
    title: 'User',
    items: [
      { label: 'Account', href: '/profile/user/account', description: 'Name, email, security' },
      { label: 'Data & Privacy', href: '/profile/user/privacy', description: 'Visibility and sharing' },
    ],
  },
  {
    title: 'Billing',
    items: [{ label: 'Billing', href: '/profile/billing', description: 'Membership and payments' }],
  },
  {
    title: 'Notifications',
    items: [
      { label: 'Notifications', href: '/profile/notifications', description: 'Email and SMS' },
    ],
  },
  {
    title: 'Preferences',
    items: [
      { label: 'Gear', href: '/profile/preferences/gear', description: 'What you have and need' },
      { label: 'Skills', href: '/profile/preferences/skills', description: 'Certifications' },
      { label: 'Interests', href: '/profile/preferences/interests', description: 'Trips you enjoy' },
      { label: 'Theme', href: '/profile/preferences/theme', description: 'Light or dark' },
    ],
  },
  {
    title: 'Events',
    items: [
      { label: 'Emergency contact', href: '/profile/events/emergency-contact', description: 'Who to call' },
      { label: 'Liability waiver', href: '/profile/events/liability-waiver', description: 'Signatures' },
      { label: 'Travel prefs', href: '/profile/events/travel-prefs', description: 'Carpool details' },
    ],
  },
]
