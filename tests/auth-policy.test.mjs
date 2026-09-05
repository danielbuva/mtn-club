import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { isAuthSensitiveUrl } from '../lib/auth/analytics.ts'
import { parseEmailOtpType } from '../lib/auth/confirmation.ts'
import { authErrorMessage } from '../lib/auth/errors.ts'
import { passwordError, validateCredentials } from '../lib/auth/password.ts'
import { authReleaseErrors } from '../lib/auth/release-config.ts'
import { getEmailVerificationStatus } from '../lib/auth/verification.ts'

test('email signup requires confirmation when same-email linking is supported', () => {
  const config = readFileSync(
    new URL('../supabase/config.toml', import.meta.url),
    'utf8',
  )
  const emailSection = config.match(/\[auth\.email\]([\s\S]*?)(?=\n\[|$)/)?.[1]
  assert.ok(emailSection, 'auth.email configuration is required')
  assert.match(emailSection, /^enable_confirmations\s*=\s*true\s*$/m)
  assert.match(emailSection, /^double_confirm_changes\s*=\s*true\s*$/m)
})

test('new passwords have a 12-code-point minimum without composition rules', () => {
  for (const value of ['', 'x'.repeat(11), '🏔'.repeat(11)])
    assert.ok(passwordError(value))
  for (const value of [
    'x'.repeat(12),
    ' '.repeat(12),
    '🏔'.repeat(12),
    ' a nice passphrase ',
  ])
    assert.equal(passwordError(value), undefined)
})
test('login accepts existing short passwords and signup preserves spaces', () => {
  assert.deepEqual(
    validateCredentials(
      { email: ' user@example.com ', password: 'short', confirmPassword: '' },
      'login',
    ),
    {},
  )
  assert.equal(
    validateCredentials(
      {
        email: 'user@example.com',
        password: ' passphrase ',
        confirmPassword: 'passphrase',
      },
      'signup',
    ).confirmPassword,
    'Passwords do not match.',
  )
  assert.ok(
    validateCredentials(
      { email: 'bad', password: '', confirmPassword: '' },
      'login',
    ).email,
  )
})
test('provider errors have actionable messages and never echo raw messages', () => {
  for (const code of [
    'invalid_credentials',
    'user_already_exists',
    'weak_password',
    'over_email_send_rate_limit',
    'over_request_rate_limit',
    'captcha_failed',
    'otp_expired',
    'flow_state_not_found',
    'same_password',
    'reauthentication_needed',
  ]) {
    const message = authErrorMessage({
      code,
      message: 'secret raw provider payload',
    })
    assert.ok(message.length > 20)
    assert.ok(!message.includes('secret raw provider payload'))
  }
  assert.match(authErrorMessage(new Error('raw secret')), /connection/)
})
test('automatic confirmation and editable metadata are not mailbox proof', () => {
  assert.equal(
    getEmailVerificationStatus({
      email: 'a@example.com',
      app_metadata: {},
      email_confirmed_at: '2026-01-01',
      user_metadata: {
        email_verified: true,
        email_verification: {
          email: 'a@example.com',
          verified_at: '2026-01-01',
        },
      },
    }).verified,
    false,
  )
})
test('protected mailbox proof is bound to the current email and has a valid timestamp', () => {
  const user = {
    email: 'A@example.com',
    app_metadata: {
      role: 'member',
      email_verification: {
        email: 'a@example.com',
        verified_at: '2026-01-01T12:00:00Z',
      },
    },
  }
  assert.deepEqual(getEmailVerificationStatus(user), {
    verified: true,
    method: 'code',
  })
  assert.equal(
    getEmailVerificationStatus({ ...user, email: 'new@example.com' }).verified,
    false,
  )
  assert.equal(
    getEmailVerificationStatus({
      ...user,
      app_metadata: {
        email_verification: { email: 'a@example.com', verified_at: 'invalid' },
      },
    }).verified,
    false,
  )
  for (const value of [null, 'verified', [], { email_verification: true }])
    assert.equal(
      getEmailVerificationStatus({ ...user, app_metadata: value }).verified,
      false,
    )
})
test('only explicitly verified matching Google/Discord identity email counts', () => {
  for (const provider of ['google', 'discord']) {
    const user = {
      email: 'a@example.com',
      app_metadata: {},
      identities: [
        {
          provider,
          identity_data: { email: 'A@example.com', email_verified: true },
        },
      ],
    }
    assert.equal(getEmailVerificationStatus(user).verified, true)
    assert.equal(
      getEmailVerificationStatus({ ...user, email: 'new@example.com' })
        .verified,
      false,
    )
    for (const email_verified of [false, 'true', undefined])
      assert.equal(
        getEmailVerificationStatus({
          ...user,
          identities: [
            {
              provider,
              identity_data: { email: 'a@example.com', email_verified },
            },
          ],
        }).verified,
        false,
      )
  }
  assert.equal(
    getEmailVerificationStatus({
      email: 'a@example.com',
      app_metadata: {},
      identities: [
        {
          provider: 'email',
          identity_data: { email: 'a@example.com', email_verified: true },
        },
      ],
    }).verified,
    false,
  )
})
test('email token types are narrowed, not cast from arbitrary input', () => {
  assert.equal(parseEmailOtpType('recovery'), 'recovery')
  assert.equal(parseEmailOtpType('invite'), 'invite')
  assert.equal(parseEmailOtpType('administrator'), null)
  assert.equal(parseEmailOtpType(null), null)
})
test('analytics drops auth paths and sensitive search/hash parameters', () => {
  for (const value of [
    '/auth/login',
    '/auth/confirm?token_hash=secret',
    '/profile?code=secret',
    '/#access_token=secret',
    '/membership?returnTo=%2Fadmin',
    'https://unlvmountainclub.com/?email=user',
  ])
    assert.equal(isAuthSensitiveUrl(value), true)
  assert.equal(isAuthSensitiveUrl('/welcome?source=fair'), false)
  assert.equal(isAuthSensitiveUrl('/membership'), false)
})
test('production configuration fails closed for missing keys and email sign-off', () => {
  assert.ok(authReleaseErrors({}).length >= 6)
  const env = {
    NEXT_PUBLIC_SUPABASE_URL: 'https://isolated.supabase.co',
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'public-placeholder',
    SUPABASE_SECRET_KEY: 'secret-placeholder',
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: 'production-placeholder',
    NEXT_PUBLIC_SITE_URL: 'https://unlvmountainclub.com',
    AUTH_EMAIL_DELIVERY_VERIFIED: 'true',
  }
  assert.deepEqual(authReleaseErrors(env), [])
  assert.ok(
    authReleaseErrors({
      ...env,
      NEXT_PUBLIC_TURNSTILE_SITE_KEY: '1x00000000000000000000AA',
    }).length,
  )
  assert.ok(
    authReleaseErrors({ ...env, NEXT_PUBLIC_SITE_URL: 'http://localhost:3000' })
      .length,
  )
  assert.ok(
    authReleaseErrors({ ...env, AUTH_EMAIL_DELIVERY_VERIFIED: 'false' }).length,
  )
})

test('analytics excludes admin routes without excluding similarly named public routes', () => {
  assert.equal(isAuthSensitiveUrl('/admin'), true)
  assert.equal(
    isAuthSensitiveUrl('https://unlvmountainclub.com/admin/accounts/example'),
    true,
  )
  assert.equal(isAuthSensitiveUrl('/administration-guide'), false)
})
