import type Stripe from 'stripe'
import {
  createStripeClient,
  getMembershipStripeConfig,
} from '@/lib/stripe/config'
import { createAdminClient } from '@/lib/supabase/admin'

class WebhookValidationError extends Error {}

const expandableId = <T extends { id: string }>(
  value: string | T | null,
): string | null => (typeof value === 'string' ? value : (value?.id ?? null))

const eventTimestamp = (event: Stripe.Event) =>
  new Date(event.created * 1000).toISOString()

async function markEvent(
  event: Stripe.Event,
  status: 'succeeded' | 'failed',
  lastError: string | null,
) {
  const admin = createAdminClient()
  const { error } = await admin.from('stripe_webhook_events').upsert(
    {
      stripe_event_id: event.id,
      event_type: event.type,
      test_mode: !event.livemode,
      status,
      last_error: lastError,
      processed_at: status === 'succeeded' ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'stripe_event_id' },
  )
  if (error) throw error
}

async function processPaidCheckout(
  event: Stripe.Event,
  session: Stripe.Checkout.Session,
) {
  const config = getMembershipStripeConfig()
  const stripe = createStripeClient()
  const admin = createAdminClient()

  if (session.mode !== 'payment') {
    throw new WebhookValidationError('Checkout Session is not payment mode.')
  }
  if (session.payment_status !== 'paid') {
    await markEvent(event, 'succeeded', null)
    return
  }
  if (
    session.amount_total !== 2500 ||
    session.currency?.toLowerCase() !== 'usd'
  ) {
    throw new WebhookValidationError('Checkout amount or currency is invalid.')
  }

  const attemptResult = await admin
    .from('membership_checkout_attempts')
    .select(
      'id, user_id, stripe_price_id, amount_cents, currency, test_mode, status',
    )
    .eq('stripe_checkout_session_id', session.id)
    .maybeSingle()

  if (attemptResult.error) throw attemptResult.error
  const attempt = attemptResult.data
  if (!attempt) {
    throw new WebhookValidationError('No local checkout attempt exists.')
  }
  if (
    attempt.test_mode === event.livemode ||
    attempt.amount_cents !== 2500 ||
    attempt.currency !== 'usd' ||
    attempt.stripe_price_id !== config.priceId ||
    session.client_reference_id !== attempt.id
  ) {
    throw new WebhookValidationError('Local checkout attempt does not match.')
  }

  const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
    limit: 10,
  })
  const line = lineItems.data[0]
  if (
    lineItems.has_more ||
    lineItems.data.length !== 1 ||
    line?.price?.id !== config.priceId ||
    line.quantity !== 1
  ) {
    throw new WebhookValidationError('Checkout line item is invalid.')
  }

  const paymentIntentId = expandableId(session.payment_intent)
  if (!paymentIntentId) {
    throw new WebhookValidationError('Checkout has no PaymentIntent.')
  }

  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId, {
    expand: ['latest_charge'],
  })
  const latestCharge = paymentIntent.latest_charge
  const receiptUrl =
    latestCharge && typeof latestCharge !== 'string'
      ? latestCharge.receipt_url
      : null

  const restrictionResult = await admin
    .from('membership_account_restrictions')
    .select('restriction')
    .eq('user_id', attempt.user_id)
    .maybeSingle()
  if (restrictionResult.error) throw restrictionResult.error

  const { error } = await admin.rpc('process_membership_checkout_event', {
    p_amount_cents: 2500,
    p_attempt_id: attempt.id,
    p_checkout_session_id: session.id,
    p_currency: 'usd',
    p_customer_id: expandableId(session.customer),
    p_event_id: event.id,
    p_event_type: event.type,
    p_paid_at: eventTimestamp(event),
    p_payment_intent_id: paymentIntentId,
    p_receipt_url: receiptUrl,
    p_test_mode: !event.livemode,
    p_user_id: attempt.user_id,
  })
  if (error) throw error
}

async function processCheckoutFailure(
  event: Stripe.Event,
  session: Stripe.Checkout.Session,
  status: 'failed' | 'expired' | 'canceled',
) {
  const admin = createAdminClient()
  const update = await admin
    .from('membership_checkout_attempts')
    .update({ status, checkout_url: null })
    .eq('stripe_checkout_session_id', session.id)
    .eq('status', 'open')
  if (update.error) throw update.error
  await markEvent(event, 'succeeded', null)
}

async function processRefund(event: Stripe.Event, charge: Stripe.Charge) {
  const paymentIntentId = expandableId(charge.payment_intent)
  if (!paymentIntentId) {
    throw new WebhookValidationError('Refunded charge has no PaymentIntent.')
  }
  const admin = createAdminClient()
  const { error } = await admin.rpc('process_membership_refund_event', {
    p_amount_refunded: charge.amount_refunded,
    p_event_id: event.id,
    p_event_type: event.type,
    p_payment_intent_id: paymentIntentId,
    p_refund_recorded_at: eventTimestamp(event),
    p_test_mode: !event.livemode,
  })
  if (error) throw error
}

async function processDispute(event: Stripe.Event, dispute: Stripe.Dispute) {
  const paymentIntentId = expandableId(dispute.payment_intent)
  if (!paymentIntentId) {
    throw new WebhookValidationError('Dispute has no PaymentIntent.')
  }
  const admin = createAdminClient()
  const { error } = await admin.rpc('process_membership_dispute_event', {
    p_dispute_recorded_at: eventTimestamp(event),
    p_event_id: event.id,
    p_event_type: event.type,
    p_payment_intent_id: paymentIntentId,
    p_test_mode: !event.livemode,
  })
  if (error) throw error
}

export async function POST(request: Request) {
  const signature = request.headers.get('stripe-signature')
  if (!signature) {
    return new Response('Missing Stripe signature.', { status: 400 })
  }

  const rawBody = await request.text()
  const stripe = createStripeClient()
  const config = getMembershipStripeConfig()
  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      config.webhookSecret,
    )
  } catch {
    return new Response('Invalid Stripe signature.', { status: 400 })
  }

  if (event.livemode !== config.liveMode) {
    await markEvent(event, 'failed', 'Unexpected Stripe test/live mode.')
    return new Response('Unexpected Stripe mode.', { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
      case 'checkout.session.async_payment_succeeded':
        await processPaidCheckout(event, event.data.object)
        break
      case 'checkout.session.async_payment_failed':
        await processCheckoutFailure(event, event.data.object, 'failed')
        break
      case 'checkout.session.expired':
        await processCheckoutFailure(event, event.data.object, 'expired')
        break
      case 'charge.refunded':
        await processRefund(event, event.data.object)
        break
      case 'charge.dispute.created':
        await processDispute(event, event.data.object)
        break
      default:
        return Response.json({ received: true })
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown failure'
    await markEvent(event, 'failed', message)
    console.error('Stripe membership webhook failed:', error)
    return new Response('Webhook processing failed.', {
      status: error instanceof WebhookValidationError ? 400 : 500,
    })
  }

  return Response.json({ received: true })
}
