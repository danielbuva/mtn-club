'use server'

import { isMembershipCheckoutEnabled } from '@/lib/memberships/config'
import {
  createStripeClient,
  getMembershipStripeConfig,
} from '@/lib/stripe/config'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export type CheckoutActionResult =
  | { ok: true; url: string }
  | { ok: false; error: string }

const CHECKOUT_LIFETIME_SECONDS = 30 * 60

export async function createMembershipCheckout(): Promise<CheckoutActionResult> {
  if (!isMembershipCheckoutEnabled()) {
    return {
      ok: false,
      error: 'Online membership payment is not open yet.',
    }
  }

  const supabase = await createClient()
  const { data: authData, error: authError } = await supabase.auth.getUser()
  if (authError || !authData.user) {
    return { ok: false, error: 'Sign in before starting checkout.' }
  }

  const user = authData.user
  const admin = createAdminClient()
  const config = getMembershipStripeConfig()
  const stripe = createStripeClient()
  const now = new Date()

  const restrictionResult = await admin
    .from('membership_account_restrictions')
    .select('restriction')
    .eq('user_id', user.id)
    .maybeSingle()

  if (
    restrictionResult.data?.restriction === 'suspended' ||
    restrictionResult.data?.restriction === 'banned'
  ) {
    return {
      ok: false,
      error: 'This account cannot start a membership checkout.',
    }
  }

  const existingResult = await admin
    .from('membership_checkout_attempts')
    .select('id, checkout_url, expires_at, stripe_checkout_session_id')
    .eq('user_id', user.id)
    .eq('status', 'open')
    .maybeSingle()

  if (existingResult.error) {
    return { ok: false, error: 'Membership checkout is not configured yet.' }
  }

  const existing = existingResult.data
  if (
    existing?.checkout_url &&
    existing.stripe_checkout_session_id &&
    new Date(existing.expires_at) > now
  ) {
    return { ok: true, url: existing.checkout_url }
  }

  if (existing) {
    await admin
      .from('membership_checkout_attempts')
      .update({ status: 'expired', checkout_url: null })
      .eq('id', existing.id)
  }

  const expiresAt = new Date(now.getTime() + CHECKOUT_LIFETIME_SECONDS * 1000)
  const attemptResult = await admin
    .from('membership_checkout_attempts')
    .insert({
      user_id: user.id,
      status: 'open',
      stripe_price_id: config.priceId,
      amount_cents: 2500,
      currency: 'usd',
      test_mode: !config.liveMode,
      expires_at: expiresAt.toISOString(),
    })
    .select('id')
    .single()

  if (attemptResult.error) {
    return {
      ok: false,
      error: 'Another checkout may already be open. Refresh and try again.',
    }
  }

  const attemptId = attemptResult.data.id

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price: config.priceId, quantity: 1 }],
      client_reference_id: attemptId,
      customer_email: user.email,
      expires_at: Math.floor(expiresAt.getTime() / 1000),
      success_url: `${config.siteUrl}/membership?checkout=success`,
      cancel_url: `${config.siteUrl}/membership?checkout=canceled`,
      metadata: { checkout_attempt_id: attemptId },
      payment_intent_data: {
        metadata: { checkout_attempt_id: attemptId },
      },
    })

    if (!session.url) {
      throw new Error('Stripe did not return a Checkout URL.')
    }

    const updateResult = await admin
      .from('membership_checkout_attempts')
      .update({
        stripe_checkout_session_id: session.id,
        checkout_url: session.url,
      })
      .eq('id', attemptId)

    if (updateResult.error) {
      await stripe.checkout.sessions.expire(session.id)
      throw updateResult.error
    }

    return { ok: true, url: session.url }
  } catch (error: unknown) {
    await admin
      .from('membership_checkout_attempts')
      .update({ status: 'failed', checkout_url: null })
      .eq('id', attemptId)
    console.error('Unable to create membership Checkout Session:', error)
    return {
      ok: false,
      error: 'Checkout could not be started. No payment was taken.',
    }
  }
}
