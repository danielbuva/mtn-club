import 'server-only'

import Stripe from 'stripe'

const STRIPE_API_VERSION = '2025-09-30.clover' as const

const requireServerValue = (name: string) => {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`Missing server configuration: ${name}`)
  return value
}

export type MembershipStripeConfig = {
  liveMode: boolean
  priceId: string
  siteUrl: string
  webhookSecret: string
}

export function createStripeClient(): Stripe {
  return new Stripe(requireServerValue('STRIPE_SECRET_KEY'), {
    apiVersion: STRIPE_API_VERSION,
    maxNetworkRetries: 2,
    timeout: 20_000,
  })
}

export function getMembershipStripeConfig(): MembershipStripeConfig {
  const siteUrl = requireServerValue('NEXT_PUBLIC_SITE_URL')
  const parsedSiteUrl = new URL(siteUrl)
  if (
    parsedSiteUrl.protocol !== 'https:' &&
    parsedSiteUrl.hostname !== 'localhost'
  ) {
    throw new Error('NEXT_PUBLIC_SITE_URL must use HTTPS outside localhost.')
  }

  return {
    liveMode: process.env.STRIPE_LIVE_MODE === 'true',
    priceId: requireServerValue('STRIPE_MEMBERSHIP_PRICE_ID'),
    siteUrl: parsedSiteUrl.origin,
    webhookSecret: requireServerValue('STRIPE_WEBHOOK_SECRET'),
  }
}
