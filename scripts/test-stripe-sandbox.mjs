import assert from 'node:assert/strict'
import Stripe from 'stripe'

const requireValue = name => {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`Missing required sandbox setting: ${name}`)
  return value
}

if (process.env.STRIPE_LIVE_MODE === 'true') {
  throw new Error('Sandbox test refused to run with STRIPE_LIVE_MODE=true')
}

const stripe = new Stripe(requireValue('STRIPE_SECRET_KEY'), {
  apiVersion: '2025-09-30.clover',
  maxNetworkRetries: 2,
})
const priceId = requireValue('STRIPE_MEMBERSHIP_PRICE_ID')
let sessionId = null

try {
  const price = await stripe.prices.retrieve(priceId, { expand: ['product'] })
  assert.equal(price.active, true)
  assert.equal(price.livemode, false)
  assert.equal(price.type, 'one_time')
  assert.equal(price.currency, 'usd')
  assert.equal(price.unit_amount, 2500)
  assert.equal(price.recurring, null)

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [{ price: priceId, quantity: 1 }],
    client_reference_id: 'codex-sandbox-configuration-test',
    success_url: 'https://unlvmountainclub.com/membership?checkout=success',
    cancel_url: 'https://unlvmountainclub.com/membership?checkout=canceled',
    metadata: { purpose: 'sandbox_configuration_test' },
    expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
  })
  sessionId = session.id

  assert.equal(session.livemode, false)
  assert.equal(session.mode, 'payment')
  assert.equal(session.payment_status, 'unpaid')
  assert.equal(session.amount_total, 2500)
  assert.equal(session.currency, 'usd')
  assert.ok(session.url)

  const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
    limit: 10,
  })
  assert.equal(lineItems.has_more, false)
  assert.equal(lineItems.data.length, 1)
  assert.equal(lineItems.data[0]?.price?.id, priceId)
  assert.equal(lineItems.data[0]?.quantity, 1)

  const expired = await stripe.checkout.sessions.expire(session.id)
  assert.equal(expired.status, 'expired')

  console.log(
    JSON.stringify({
      result: 'stripe sandbox configuration passed',
      sessionId: session.id,
      status: expired.status,
    }),
  )
} finally {
  if (sessionId) {
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    if (session.status === 'open') {
      await stripe.checkout.sessions.expire(sessionId)
    }
  }
}
