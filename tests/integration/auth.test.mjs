import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import {
  hasRecentRecoveryProof,
  verifyRecoveryLink,
} from '../../lib/auth/recovery-policy.ts'
import { verifyEmailProof } from '../../lib/auth/verify-email-proof.ts'
import {
  admin,
  captchaToken,
  claims,
  cleanup,
  client,
  confirmationLink,
  createAccount,
  messageFor,
  origin,
  password,
  remember,
  successful,
  testEmail,
} from './auth-services.mjs'

after(cleanup)
const destination = '/trips?view=upcoming#calendar'
const redirectTo = flow =>
  `${origin}/auth/confirm?flow=${flow}&returnTo=${encodeURIComponent(destination)}`

test('real Supabase rejects email requests without CAPTCHA, including bypassing the UI', async () => {
  const email = testEmail()
  const requests = [
    () => client().auth.signUp({ email, password }),
    () => client().auth.signInWithPassword({ email, password }),
    () => client().auth.resetPasswordForEmail(email),
    () =>
      client().auth.signInWithOtp({
        email,
        options: { shouldCreateUser: false },
      }),
    () => client().auth.resend({ type: 'signup', email }),
  ]
  for (const request of requests) {
    const { error } = await request()
    assert.equal(error?.code, 'captcha_failed')
  }
})

test('confirmation-on signup sends the branded destination-preserving email and does not grant a session', async () => {
  const email = testEmail()
  const data = successful(
    await client().auth.signUp({
      email,
      password,
      options: { captchaToken, emailRedirectTo: redirectTo('signup') },
    }),
  )
  remember(data.user)
  assert.equal(data.session, null)
  const resend = await client().auth.resend({
    type: 'signup',
    email,
    options: { captchaToken, emailRedirectTo: redirectTo('signup') },
  })
  assert.equal(resend.error?.code, 'over_email_send_rate_limit')
  assert.equal(
    (
      await client().auth.signInWithPassword({
        email,
        password,
        options: { captchaToken },
      })
    ).error?.code,
    'email_not_confirmed',
  )
  const message = await messageFor(email, 'Confirm your Mountain Club email')
  const link = confirmationLink(message, 'signup')
  assert.equal(link.searchParams.get('returnTo'), destination)
  // A fresh client has no PKCE verifier or original-browser storage.
  const payload = {
    token_hash: link.searchParams.get('token_hash'),
    type: 'signup',
  }
  const confirmed = successful(await client().auth.verifyOtp(payload))
  assert.equal(confirmed.user.id, data.user.id)
  assert.ok(confirmed.session)
  assert.equal(
    (await client().auth.verifyOtp(payload)).error?.code,
    'otp_expired',
  )
  const login = successful(
    await client().auth.signInWithPassword({
      email,
      password,
      options: { captchaToken },
    }),
  )
  assert.equal(login.user.id, data.user.id)
  assert.equal(hasRecentRecoveryProof(claims(login.session).amr), false)
  const fakeReset = await verifyRecoveryLink(
    client(),
    'not-a-reset-token',
    'recovery',
  )
  assert.equal(fakeReset.receipt, null)
  assert.ok(fakeReset.error)
})

test('new short passwords fail at the server, without composition or trimming requirements', async () => {
  const { error } = await client().auth.signUp({
    email: testEmail(),
    password: 'abcdefghijk',
    options: { captchaToken },
  })
  assert.equal(error?.code, 'weak_password')
})

test('recovery in another browser has genuine recovery claims, rejects reuse, changes password and sends a notification', async () => {
  const user = await createAccount()
  successful(
    await client().auth.resetPasswordForEmail(user.email, {
      captchaToken,
      redirectTo: redirectTo('recovery'),
    }),
  )
  const link = confirmationLink(
    await messageFor(user.email, 'Reset your Mountain Club password'),
    'recovery',
  )
  assert.equal(link.searchParams.get('returnTo'), destination)
  const recoveredClient = client()
  const payload = {
    token_hash: link.searchParams.get('token_hash'),
    type: 'recovery',
  }
  const result = await verifyRecoveryLink(
    recoveredClient,
    payload.token_hash,
    'recovery',
  )
  const recovered = successful(result)
  assert.equal(recovered.user.id, user.id)
  assert.equal(
    hasRecentRecoveryProof(claims(recovered.session).amr),
    false,
    'POST verify returns OTP, not PKCE recovery AMR',
  )
  assert.equal(result.receipt?.userId, user.id)
  assert.equal(result.receipt?.sessionId, claims(recovered.session).session_id)
  assert.equal(
    (await client().auth.verifyOtp(payload)).error?.code,
    'otp_expired',
  )
  assert.equal(
    (await recoveredClient.auth.updateUser({ password: 'too short' })).error
      ?.code,
    'weak_password',
  )
  const nextPassword = ' a changed passphrase '
  successful(await recoveredClient.auth.updateUser({ password: nextPassword }))
  assert.equal(
    (
      await client().auth.signInWithPassword({
        email: user.email,
        password,
        options: { captchaToken },
      })
    ).error?.code,
    'invalid_credentials',
  )
  successful(
    await client().auth.signInWithPassword({
      email: user.email,
      password: nextPassword,
      options: { captchaToken },
    }),
  )
  const notification = await messageFor(
    user.email,
    'Your Mountain Club password was changed',
  )
  assert.match(notification.HTML, /UNLV MOUNTAIN CLUB/)
})

test('officer/admin-authorized recovery is exempt from CAPTCHA but still sends the branded link', async () => {
  const user = await createAccount()
  successful(
    await admin.auth.resetPasswordForEmail(user.email, {
      redirectTo: redirectTo('recovery'),
    }),
  )
  confirmationLink(
    await messageFor(user.email, 'Reset your Mountain Club password'),
    'recovery',
  )
})

test('outstanding PKCE recovery codes require the original verifier and retain recovery AMR', async () => {
  const user = await createAccount()
  const storage = new Map()
  const pkce = client({
    auth: {
      persistSession: true,
      autoRefreshToken: false,
      flowType: 'pkce',
      storage: {
        getItem: key => storage.get(key) ?? null,
        setItem: (key, value) => storage.set(key, value),
        removeItem: key => storage.delete(key),
      },
    },
  })
  successful(
    await pkce.auth.resetPasswordForEmail(user.email, {
      captchaToken,
      redirectTo: redirectTo('recovery'),
    }),
  )
  const link = confirmationLink(
    await messageFor(user.email, 'Reset your Mountain Club password'),
    'recovery',
  )
  // Simulate the Supabase-hosted link from the previous email template.
  const legacy = new URL('http://127.0.0.1:55321/auth/v1/verify')
  legacy.search = new URLSearchParams({
    token: link.searchParams.get('token_hash'),
    type: 'recovery',
    redirect_to: redirectTo('recovery'),
  }).toString()
  const response = await fetch(legacy, { redirect: 'manual' })
  assert.equal(response.status, 303)
  const callback = new URL(response.headers.get('location'))
  assert.equal(callback.origin, origin)
  const code = callback.searchParams.get('code')
  assert.ok(code, 'Legacy link must return a PKCE code')
  assert.ok((await client().auth.exchangeCodeForSession(code)).error)
  const exchanged = successful(await pkce.auth.exchangeCodeForSession(code))
  assert.equal(exchanged.user.id, user.id)
  assert.ok(hasRecentRecoveryProof(claims(exchanged.session).amr))
  assert.ok((await pkce.auth.exchangeCodeForSession(code)).error)
})

test('six-digit OTP verification preserves the existing session and unrelated protected metadata', async () => {
  const user = await createAccount()
  successful(
    await admin.auth.admin.updateUserById(user.id, {
      app_metadata: { keep: 'preserved' },
    }),
  )
  const signedIn = client()
  const login = successful(
    await signedIn.auth.signInWithPassword({
      email: user.email,
      password,
      options: { captchaToken },
    }),
  )
  successful(
    await client().auth.signInWithOtp({
      email: user.email,
      options: { shouldCreateUser: false, captchaToken },
    }),
  )
  const message = await messageFor(
    user.email,
    'Your Mountain Club verification code',
  )
  const code = message.HTML.match(/>\s*(\d{6})\s*</)?.[1]
  assert.ok(code, 'Must send exactly six digits')
  assert.doesNotMatch(message.HTML, /token_hash|\/auth\/v1\/verify/)
  const transient = client()
  const result = await verifyEmailProof(user, code, {
    verify: async (email, token) => {
      const { data, error } = await transient.auth.verifyOtp({
        email,
        token,
        type: 'email',
      })
      return { user: data.user, error: error?.code ?? null }
    },
    currentAccount: async id =>
      successful(await admin.auth.admin.getUserById(id)).user,
    saveMetadata: async (id, app_metadata) =>
      !(await admin.auth.admin.updateUserById(id, { app_metadata })).error,
  })
  assert.equal(result.verified, true)
  const saved = successful(await admin.auth.admin.getUserById(user.id)).user
  assert.equal(saved.app_metadata.keep, 'preserved')
  assert.equal(saved.app_metadata.email_verification.email, user.email)
  assert.equal(
    (await signedIn.auth.getSession()).data.session.access_token,
    login.session.access_token,
  )
  assert.equal(
    (
      await client().auth.verifyOtp({
        email: user.email,
        token: code,
        type: 'email',
      })
    ).error?.code,
    'otp_expired',
  )
})
