import 'server-only'

export const isMembershipCheckoutEnabled = () =>
  process.env.MEMBERSHIP_CHECKOUT_ENABLED === 'true'
