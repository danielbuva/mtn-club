import Link from 'next/link'
import { SheetClose } from '@/components/ui/sheet'
import { getViewer } from '@/lib/auth/viewer'
import { CLUB_EMAIL, DISCORD_INVITE_URL, INSTAGRAM_URL } from '@/lib/constants'

type NavigationLink = { href: string; label: string }
type NavigationGroup = { title: string; links: NavigationLink[] }

const explore: NavigationGroup = {
  title: 'Get outside',
  links: [
    { href: '/', label: 'Home' },
    { href: '/schedule', label: 'Trip schedule' },
    { href: '/trips', label: 'Trips & events' },
    { href: '/calendar', label: 'Calendar' },
    { href: '/gallery', label: 'Photo gallery' },
  ],
}
const club: NavigationGroup = {
  title: 'Know the club',
  links: [
    { href: '/welcome', label: 'Welcome' },
    { href: '/learn-more', label: 'Learn more' },
    { href: '/about', label: 'About us' },
    { href: '/team', label: 'Meet the team' },
    { href: '/cost', label: 'Costs & dues' },
    { href: '/gear', label: 'Gear guide' },
    { href: '/safety', label: 'Safety' },
    { href: '/faq', label: 'Common questions' },
  ],
}

export async function MoreNavigationLinks() {
  const viewer = await getViewer()
  const account: NavigationGroup = {
    title: viewer.isAuthenticated ? 'Your account' : 'Join the community',
    links: viewer.isAuthenticated
      ? [
          { href: '/membership', label: 'Membership status' },
          { href: '/profile/settings', label: 'Settings overview' },
          { href: '/profile/user/account', label: 'Account details' },
          { href: '/profile/user/privacy', label: 'Profile privacy' },
          { href: '/profile/billing', label: 'Billing' },
          { href: '/profile/notifications', label: 'Notifications' },
        ]
      : [
          { href: '/join', label: 'Join the community' },
          { href: '/auth/sign-up', label: 'Create an account' },
          { href: '/auth/login', label: 'Sign in' },
          { href: '/membership', label: 'Membership & dues' },
          { href: '/membership-sign-up', label: 'Apply for membership' },
        ],
  }
  const groups: NavigationGroup[] = [explore, club, account]
  if (viewer.isAuthenticated) {
    groups.push({
      title: 'Your outdoor profile',
      links: [
        { href: '/profile/preferences/interests', label: 'Interests' },
        { href: '/profile/preferences/skills', label: 'Skills' },
        { href: '/profile/preferences/gear', label: 'Your gear' },
        { href: '/profile/preferences/theme', label: 'Appearance' },
        {
          href: '/profile/events/emergency-contact',
          label: 'Emergency contact',
        },
        { href: '/profile/events/liability-waiver', label: 'Liability waiver' },
        { href: '/profile/events/travel-prefs', label: 'Travel preferences' },
      ],
    })
  }
  if (viewer.canCreateEvent) {
    groups.push({
      title: 'Plan a trip',
      links: [
        { href: '/trips/new', label: 'Create an event' },
        { href: '/trips/drafts', label: 'Your drafts' },
      ],
    })
  }
  if (viewer.isAdmin) {
    groups.push({
      title: 'Leadership',
      links: [{ href: '/admin', label: 'Admin dashboard' }],
    })
  }
  groups.push({
    title: 'Stay connected',
    links: [
      { href: DISCORD_INVITE_URL, label: 'Discord' },
      { href: INSTAGRAM_URL, label: 'Instagram' },
      { href: `mailto:${CLUB_EMAIL}`, label: 'Contact us' },
      { href: '/privacy', label: 'Privacy policy' },
      { href: '/terms', label: 'Terms of use' },
    ],
  })

  return groups.map(group => (
    <section key={group.title} className="space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        {group.title}
      </h3>
      <ul className="grid grid-cols-2 gap-x-4">
        {group.links.map(link => (
          <li key={link.href} className="min-w-0">
            <SheetClose asChild>
              <Link
                href={link.href}
                className="flex min-h-12 items-center py-3 text-sm font-medium underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                {link.label}
              </Link>
            </SheetClose>
          </li>
        ))}
      </ul>
    </section>
  ))
}
