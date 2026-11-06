import 'server-only'
import { createHash, randomBytes, randomInt } from 'node:crypto'

/** Secrets never reach the database in plain form; only their SHA-256 hex digests do. */
export const sha256 = (value: string): string =>
  createHash('sha256').update(value).digest('hex')

export function newSecret(): { secret: string; hash: string } {
  const secret = randomBytes(32).toString('base64url')
  return { secret, hash: sha256(secret) }
}

export const isTokenShape = (value: string): boolean =>
  /^[A-Za-z0-9_-]{43}$/.test(value)

/** Six digits, uniformly random. */
export const newCode = (): string =>
  randomInt(0, 1_000_000).toString().padStart(6, '0')

/** The code is bound to its link so a code for one request cannot unlock another. */
export const codeHash = (tokenHash: string, code: string): string =>
  sha256(`guardian-code:${tokenHash}:${code}`)

export const GUARDIAN_SESSION_COOKIE = 'mtn_guardian_session'
