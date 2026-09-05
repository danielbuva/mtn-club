import assert from 'node:assert/strict'
import test from 'node:test'
import { Webhook } from 'svix'
import { registrationEmail } from '../lib/registration/email.ts'
import {
  questionsSchema,
  registrationInputSchema,
  settingsInputSchema,
} from '../lib/registration/schema.ts'

const tripId = '11111111-1111-4111-8111-111111111111'
const notification = {
  id: tripId,
  tripId,
  title: '<img src=x onerror=alert(1)>',
  kind: 'offered',
  email: 'test@example.test',
  startAt: '2026-11-01T16:00:00Z',
  timeZone: 'America/Los_Angeles',
  offerExpiresAt: '2026-11-01T09:30:00Z',
}

test('offer email escapes user content and links to review, never an acceptance command', () => {
  const email = registrationEmail(notification, 'https://club.example.test')
  assert.ok(email.html.includes('&lt;img'))
  assert.ok(!email.html.includes('<img'))
  assert.ok(email.text.includes(`/trips/${tripId}/rsvp`))
  assert.ok(!email.html.includes('?'))
  assert.ok(email.text.includes('America/Los_Angeles'))
})
test('email origins cannot use script URLs', () => {
  assert.throws(() => registrationEmail(notification, 'javascript:alert(1)'))
})
test('question definitions reject duplicate IDs and choice lists', () => {
  const q = {
    id: 'gear',
    label: 'Gear',
    type: 'single',
    required: true,
    options: ['Yes', 'No'],
  }
  assert.equal(questionsSchema.safeParse([q]).success, true)
  assert.equal(questionsSchema.safeParse([q, q]).success, false)
  assert.equal(
    questionsSchema.safeParse([{ ...q, options: ['Yes', 'Yes'] }]).success,
    false,
  )
  assert.equal(
    questionsSchema.safeParse([{ ...q, id: '__proto__' }]).success,
    false,
  )
})
test('commands require request identity and revision; organizer input is bounded', () => {
  const command = {
    tripId,
    command: 'register',
    requestId: tripId,
    expectedRevision: 0,
    data: { formVersion: 1, answers: { experience: false } },
  }
  assert.equal(registrationInputSchema.safeParse(command).success, true)
  assert.equal(
    registrationInputSchema.safeParse({ ...command, command: 'toggle' })
      .success,
    false,
  )
  assert.equal(
    registrationInputSchema.safeParse({ ...command, requestId: '' }).success,
    false,
  )
  assert.equal(
    registrationInputSchema.safeParse({ ...command, data: { confirmed: true } })
      .success,
    false,
  )
  assert.equal(
    settingsInputSchema.safeParse({
      enabled: true,
      eligibility: 'account',
      emergencyRequired: false,
      waiverRequired: false,
      questions: [],
      capacity: 0,
      waitlistEnabled: true,
      deadline: null,
      offerHours: 24,
    }).success,
    false,
  )
})
test('delivery verification rejects tampering, missing signatures, and stale signed timestamps', () => {
  const secret = `whsec_${Buffer.from('registration-test-signing-secret-123456').toString('base64')}`
  const wh = new Webhook(secret)
  const raw = JSON.stringify({
    type: 'email.delivered',
    data: { email_id: tripId },
  })
  const now = new Date()
  const headers = {
    'svix-id': 'msg_registration',
    'svix-timestamp': String(Math.floor(now.getTime() / 1000)),
    'svix-signature': wh.sign('msg_registration', now, raw),
  }
  assert.doesNotThrow(() => wh.verify(raw, headers))
  assert.throws(() => wh.verify(`${raw} `, headers))
  assert.throws(() => wh.verify(raw, { ...headers, 'svix-signature': '' }))
  const old = new Date(Date.now() - 3600000)
  assert.throws(() =>
    wh.verify(raw, {
      ...headers,
      'svix-timestamp': String(Math.floor(old.getTime() / 1000)),
      'svix-signature': wh.sign('msg_registration', old, raw),
    }),
  )
})

test('delivery retries provider outages and rate limits with stable deduplication', async () => {
  const { deliverRegistrationEmail } = await import(
    '../lib/registration/delivery.ts'
  )
  const input = {
    jobId: tripId,
    apiKey: 'synthetic-key',
    from: 'Club <club@example.test>',
    to: 'test@example.test',
    message: registrationEmail(notification, 'https://club.example.test'),
  }
  const keys = []
  for (const status of [429, 500, 503, 403, 422]) {
    const result = await deliverRegistrationEmail(
      input,
      async (_url, options) => {
        keys.push(options.headers['Idempotency-Key'])
        return new Response('{}', { status })
      },
    )
    assert.equal(result.retry, status === 429 || status >= 500)
    assert.equal(result.providerId, null)
    assert.equal(result.errorCode, `provider_${status}`)
  }
  assert.deepEqual([...new Set(keys)], [`registration/${tripId}`])
  const accepted = await deliverRegistrationEmail(input, async () =>
    Response.json({ id: 'provider-test' }),
  )
  assert.deepEqual(accepted, {
    providerId: 'provider-test',
    errorCode: null,
    retry: false,
  })
  const interrupted = await deliverRegistrationEmail(input, async () => {
    throw new Error('synthetic timeout')
  })
  assert.equal(interrupted.retry, true)
  const invalid = await deliverRegistrationEmail(input, async () =>
    Response.json({ unexpected: true }),
  )
  assert.equal(invalid.errorCode, 'invalid_provider_response')
})
