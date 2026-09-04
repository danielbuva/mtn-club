import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { setTimeout as delay } from 'node:timers/promises'
import { createClient } from '@supabase/supabase-js'

// Deliberately no environment overrides: this suite must never reach production.
export const origin = 'http://127.0.0.1:3130'
export const captchaToken = 'XXXX.DUMMY.TOKEN.XXXX'
const api = 'http://127.0.0.1:55321'
const mail = 'http://127.0.0.1:55324'
export const status = JSON.parse(
  execFileSync(
    'pnpm',
    [
      'exec',
      'supabase',
      'status',
      '--workdir',
      'tests/integration',
      '-o',
      'json',
    ],
    {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    },
  ),
)
assert.equal(
  status.API_URL,
  api,
  'Only the dedicated localhost sandbox is allowed',
)
const settings = JSON.parse(
  execFileSync('docker', ['inspect', 'supabase_auth_mtn-auth-integration'], {
    encoding: 'utf8',
  }),
)[0].Config.Env
assert.ok(settings.includes('GOTRUE_SECURITY_CAPTCHA_ENABLED=true'))
assert.ok(
  settings.includes(
    'GOTRUE_SECURITY_CAPTCHA_SECRET=1x0000000000000000000000000000000AA',
  ),
  'Start the sandbox with the documented test-secret environment override',
)
assert.ok(settings.includes('GOTRUE_MAILER_AUTOCONFIRM=false'))
assert.ok(settings.includes('GOTRUE_PASSWORD_MIN_LENGTH=12'))
assert.ok(
  settings.some(value =>
    /^GOTRUE_SMTP_HOST=supabase_inbucket_mtn-auth-integration$/.test(value),
  ),
  'Emails must stay in the sandbox mail capture',
)

const clientOptions = {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
}
export const client = (options = {}) =>
  createClient(api, status.ANON_KEY, {
    ...clientOptions,
    ...options,
  })
export const admin = createClient(api, status.SERVICE_ROLE_KEY, clientOptions)
const createdUsers = new Set()
export const testEmail = () => `auth-${randomUUID()}@example.test`
export const password = ' twelve spaces preserved '

export function remember(user) {
  assert.ok(user?.id, 'Expected a sandbox user')
  createdUsers.add(user.id)
  return user
}

/**
 * @template T
 * @param {{ data: T, error: null } | { data: unknown, error: { code?: string } }} result
 * @returns {T}
 */
export function successful(result) {
  assert.equal(
    Boolean(result.error),
    false,
    `Auth request failed: ${result.error?.code}`,
  )
  return result.data
}

export async function createAccount() {
  const email = testEmail()
  const { user } = successful(
    await admin.auth.admin.createUser({ email, password, email_confirm: true }),
  )
  return remember(user)
}

export async function messageFor(email, subject) {
  for (let attempt = 0; attempt < 30; attempt++) {
    const response = await fetch(`${mail}/api/v1/messages`)
    assert.ok(response.ok, 'Local mail capture must be available')
    const { messages } = await response.json()
    const match = messages.find(
      item =>
        item.Subject === subject && item.To.some(to => to.Address === email),
    )
    if (match) return (await fetch(`${mail}/api/v1/message/${match.ID}`)).json()
    await delay(100)
  }
  throw new Error(`Local email did not arrive: ${subject}`)
}

export function confirmationLink(message, type) {
  assert.match(message.HTML, /UNLV MOUNTAIN CLUB/)
  assert.doesNotMatch(
    message.HTML,
    /sendibt|click\.resend|\.ConfirmationURL|\{\{/,
  )
  const href = message.HTML.match(/href="([^"]*token_hash=[^"]*)"/)?.[1]
  assert.ok(href, 'Branded email must contain an actionable confirmation link')
  const link = new URL(href.replaceAll('&amp;', '&'))
  assert.equal(link.origin, origin)
  assert.equal(link.pathname, '/auth/confirm')
  assert.equal(link.searchParams.get('type'), type)
  assert.ok(link.searchParams.get('token_hash'))
  return link
}

export function claims(session) {
  assert.ok(session?.access_token, 'Expected an authenticated local session')
  return JSON.parse(
    Buffer.from(session.access_token.split('.')[1], 'base64url').toString(),
  )
}

export async function cleanup() {
  for (const id of createdUsers) {
    successful(await admin.auth.admin.deleteUser(id))
    createdUsers.delete(id)
  }
}
