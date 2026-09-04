import { createServer } from 'node:http'

// Deliberately incomplete, localhost-only fake for server-side recovery tests.
// It has no database, upstream forwarding, mail transport, or real credentials.
const user = {
  id: '00000000-0000-4000-8000-000000000001',
  email: 'member@example.test',
  aud: 'authenticated',
  role: 'authenticated',
  created_at: '2026-01-01T00:00:00Z',
  app_metadata: {},
  user_metadata: {},
  identities: [],
}
const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url')
// Token-hash POST verification returns OTP AMR, including recovery links.
const session = (method = 'otp') => ({
  access_token: `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ sub: user.id, session_id: 'isolated-recovery-session', amr: [{ method, timestamp: Math.floor(Date.now() / 1000) }], exp: Math.floor(Date.now() / 1000) + 3600 })}.dGVzdA`,
  refresh_token: 'isolated-refresh',
  expires_in: 3600,
  token_type: 'bearer',
  user,
})
const used = new Set()
const requests = []
const server = createServer(async (request, response) => {
  response.setHeader('Content-Type', 'application/json')
  const url = new URL(request.url ?? '/', 'http://127.0.0.1:54399')
  if (url.pathname === '/health') {
    response.end('{}')
    return
  }
  if (url.pathname === '/test/requests') {
    response.end(JSON.stringify(requests))
    return
  }
  if (url.pathname === '/test/reset-identities' && request.method === 'POST') {
    user.identities = []
    response.end('{}')
    return
  }
  if (
    [
      '/rest/v1/profiles',
      '/rest/v1/profile_private',
      '/rest/v1/memberships',
      '/rest/v1/rpc/get_my_membership_access',
    ].includes(url.pathname)
  ) {
    response.end('[]')
    return
  }
  if (url.pathname === '/rest/v1/rpc/has_admin_capability') {
    response.end('false')
    return
  }
  if (url.pathname === '/auth/v1/user/identities/authorize') {
    const target = new URL('/auth/v1/authorize', url.origin)
    target.search = url.search
    response.end(JSON.stringify({ url: target.toString() }))
    return
  }
  if (
    url.pathname === '/auth/v1/token' &&
    url.searchParams.get('grant_type') === 'pkce'
  ) {
    let raw = ''
    for await (const chunk of request) raw += chunk
    const body = JSON.parse(raw)
    if (body.auth_code === 'isolated-link-google' && body.code_verifier) {
      user.identities = [
        {
          id: 'isolated-google',
          identity_id: 'isolated-google',
          user_id: user.id,
          provider: 'google',
          identity_data: { email: user.email, email_verified: true },
        },
      ]
      response.end(JSON.stringify(session('oauth')))
      return
    }
  }
  if (url.pathname === '/auth/v1/user' && request.method === 'GET') {
    response.end(JSON.stringify(user))
    return
  }
  if (url.pathname === '/auth/v1/user' && request.method === 'PUT') {
    let raw = ''
    for await (const chunk of request) raw += chunk
    const body = JSON.parse(raw)
    requests.push({ action: 'password-update', password: body.password })
    response.end(JSON.stringify(user))
    return
  }
  if (url.pathname === '/auth/v1/verify' && request.method === 'POST') {
    let raw = ''
    for await (const chunk of request) raw += chunk
    const body = JSON.parse(raw)
    requests.push({ token_hash: body.token_hash, type: body.type })
    if (
      typeof body.token_hash === 'string' &&
      body.token_hash.startsWith('isolated-valid-') &&
      !used.has(body.token_hash)
    ) {
      used.add(body.token_hash)
      response.end(JSON.stringify(session()))
      return
    }
    response.statusCode = 403
    response.end(
      JSON.stringify({
        error_code: 'otp_expired',
        message: 'raw expired token response',
      }),
    )
    return
  }
  response.statusCode = 400
  response.end(
    JSON.stringify({
      error_code: 'invalid_credentials',
      message: 'Unmocked request',
    }),
  )
})
server.listen(54399, '127.0.0.1')
