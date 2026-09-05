// Redirect before a streamed Cache Components shell starts rendering. Next 16.1
// can otherwise fail a first anonymous navigation with React hook error 310.
export function requiresRegistrationSignIn(pathname: string) {
  return (
    /^\/trips\/[^/]+\/(rsvp|registrations)(\/|$)/.test(pathname) ||
    /^\/admin\/trips\/[^/]+\/registrations(\/|$)/.test(pathname) ||
    pathname === '/trips/new' ||
    pathname === '/calendar/new' ||
    pathname === '/admin/trips/new' ||
    pathname === '/profile/trips' ||
    pathname === '/profile/user/privacy' ||
    pathname === '/profile/notifications' ||
    pathname === '/admin/registration' ||
    pathname === '/admin/membership/trip-guardian-reviews'
  )
}
