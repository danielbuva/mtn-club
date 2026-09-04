import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { after, test } from 'node:test'
import { verifyRecoveryLink } from '../../lib/auth/recovery-policy.ts'
import { getEmailVerificationStatus } from '../../lib/auth/verification.ts'
import {
  admin,
  captchaToken,
  cleanup,
  client,
  createAccount,
  successful,
} from './auth-services.mjs'

after(cleanup)

test('real expired recovery tokens never produce a password receipt', async () => {
  const user = await createAccount()
  const link = successful(
    await admin.auth.admin.generateLink({
      type: 'recovery',
      email: user.email,
    }),
  )
  assert.match(user.id, /^[0-9a-f-]{36}$/)
  // Only this newly-created local test user; no timer shortcuts in app code.
  execFileSync(
    'docker',
    [
      'exec',
      'supabase_db_mtn-auth-integration',
      'psql',
      '-U',
      'postgres',
      '-d',
      'postgres',
      '-v',
      'ON_ERROR_STOP=1',
      '-c',
      `update auth.users set recovery_sent_at = now() - interval '2 hours' where id = '${user.id}' and email like 'auth-%@example.test'`,
    ],
    { stdio: 'ignore' },
  )
  const result = await verifyRecoveryLink(
    client(),
    link.properties.hashed_token,
    'recovery',
  )
  assert.equal(result.error?.code, 'otp_expired')
  assert.equal(result.receipt, null)
})

test('legacy shorter passwords remain valid for login after the minimum increases', async () => {
  const user = await createAccount()
  assert.match(user.id, /^[0-9a-f-]{36}$/)
  // Simulate a password created before the policy change, using a local hash.
  execFileSync(
    'docker',
    [
      'exec',
      'supabase_db_mtn-auth-integration',
      'psql',
      '-U',
      'postgres',
      '-d',
      'postgres',
      '-v',
      'ON_ERROR_STOP=1',
      '-c',
      `update auth.users set encrypted_password = extensions.crypt('oldpass', extensions.gen_salt('bf')) where id = '${user.id}' and email like 'auth-%@example.test'`,
    ],
    { stdio: 'ignore' },
  )
  const data = successful(
    await client().auth.signInWithPassword({
      email: user.email,
      password: 'oldpass',
      options: { captchaToken },
    }),
  )
  assert.equal(data.user.id, user.id)
})

test('an actual account email change invalidates protected proof for the previous email', async () => {
  const user = await createAccount()
  successful(
    await admin.auth.admin.updateUserById(user.id, {
      app_metadata: {
        email_verification: {
          email: user.email,
          verified_at: new Date().toISOString(),
        },
        keep: 'unchanged',
      },
    }),
  )
  const before = successful(await admin.auth.admin.getUserById(user.id)).user
  assert.equal(getEmailVerificationStatus(before).verified, true)
  const updated = successful(
    await admin.auth.admin.updateUserById(user.id, {
      email: user.email.replace('@', '-changed@'),
      email_confirm: true,
    }),
  ).user
  assert.equal(getEmailVerificationStatus(updated).verified, false)
  assert.equal(updated.app_metadata.keep, 'unchanged')
})
