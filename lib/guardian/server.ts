import 'server-only'
import { cookies } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import {
  type GuardianRequestView,
  type GuardianStatus,
  guardianRequestViewSchema,
  guardianStatusSchema,
} from './schema'
import { GUARDIAN_SESSION_COOKIE, isTokenShape, sha256 } from './secrets'

/** User-facing database messages (raised as P0001) pass through; anything else is generic. */
export function rpcMessage(
  error: { code?: string; message: string } | null,
  fallback: string,
): string {
  return error?.code === 'P0001' ? error.message : fallback
}

export async function getMyGuardianStatus(
  tripId: string | null = null,
): Promise<GuardianStatus | null> {
  const db = await createClient()
  const { data, error } = await db.rpc('get_my_guardian_status', {
    p_trip: tripId ?? undefined,
  })
  if (error) return null
  return guardianStatusSchema.parse(data)
}

export async function sessionHash(): Promise<string | null> {
  const value = (await cookies()).get(GUARDIAN_SESSION_COOKIE)?.value
  return value && isTokenShape(value) ? sha256(value) : null
}

export function tokenHash(token: string): string | null {
  return isTokenShape(token) ? sha256(token) : null
}

export async function getGuardianView(
  token: string,
): Promise<GuardianRequestView> {
  const hash = tokenHash(token)
  if (!hash) return { state: 'invalid' }
  const { data, error } = await createAdminClient().rpc(
    'guardian_get_request',
    { p_token_hash: hash, p_session_hash: (await sessionHash()) ?? undefined },
  )
  if (error) throw new Error('guardian_request_unavailable')
  return guardianRequestViewSchema.parse(data)
}
