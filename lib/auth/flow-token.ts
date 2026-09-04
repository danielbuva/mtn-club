import { createHmac, timingSafeEqual } from 'node:crypto'

// Only the server can create these short-lived UI-flow receipts. They do not
// replace Supabase session verification or grant application permissions.
export function sealAuthFlow(value: object, secret: string): string {
  if (!secret) throw new Error('Missing authentication flow signing key')
  const payload = Buffer.from(JSON.stringify(value)).toString('base64url')
  const signature = createHmac('sha256', secret)
    .update(`mountain-club:auth-flow:v1:${payload}`)
    .digest('base64url')
  return `${payload}.${signature}`
}
export function openAuthFlow(
  token: string | undefined,
  secret: string,
  now = Date.now(),
): Record<string, unknown> | null {
  if (!token || !secret || token.length > 4096) return null
  const [payload, signature, extra] = token.split('.')
  if (!payload || !signature || extra !== undefined) return null
  const expected = createHmac('sha256', secret)
    .update(`mountain-club:auth-flow:v1:${payload}`)
    .digest()
  const actual = Buffer.from(signature, 'base64url')
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected))
    return null
  try {
    const value: unknown = JSON.parse(
      Buffer.from(payload, 'base64url').toString(),
    )
    if (
      typeof value !== 'object' ||
      value === null ||
      Array.isArray(value) ||
      !('expiresAt' in value) ||
      typeof value.expiresAt !== 'number' ||
      !Number.isFinite(value.expiresAt) ||
      value.expiresAt <= now
    )
      return null
    return value as Record<string, unknown>
  } catch {
    return null
  }
}
