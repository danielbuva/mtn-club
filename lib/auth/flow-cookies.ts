import 'server-only'
import { cookies } from 'next/headers'
import { openAuthFlow, sealAuthFlow } from '@/lib/auth/flow-token'

export type FlowCookie = 'link' | 'arrival' | 'password'
const maxAge = 15 * 60
const cookieName = (kind: FlowCookie) => `mc-auth-${kind}`
export async function setAuthFlow(kind: FlowCookie, value: object) {
  const token = sealAuthFlow(
    { ...value, purpose: kind, expiresAt: Date.now() + maxAge * 1000 },
    process.env.SUPABASE_SECRET_KEY ?? '',
  )
  ;(await cookies()).set(cookieName(kind), token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge,
  })
}
export async function readAuthFlow(kind: FlowCookie) {
  const value = openAuthFlow(
    (await cookies()).get(cookieName(kind))?.value,
    process.env.SUPABASE_SECRET_KEY ?? '',
  )
  return value?.purpose === kind ? value : null
}
export async function clearAuthFlow(kind: FlowCookie) {
  ;(await cookies()).delete(cookieName(kind))
}
