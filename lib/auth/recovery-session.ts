import 'server-only'
import { readAuthFlow, setAuthFlow } from '@/lib/auth/flow-cookies'
import {
  hasRecentRecoveryProof,
  matchesPasswordReceipt,
} from '@/lib/auth/recovery-policy'
import type { createClient } from '@/lib/supabase/server'

type AuthClient = Awaited<ReturnType<typeof createClient>>

export async function grantPasswordReset(supabase: AuthClient) {
  const { data, error } = await supabase.auth.getClaims()
  const claims = data?.claims
  if (
    error ||
    !claims ||
    !hasRecentRecoveryProof(claims.amr) ||
    !claims.session_id
  )
    return false
  await setAuthFlow('password', {
    userId: claims.sub,
    sessionId: claims.session_id,
  })
  return true
}

export async function passwordResetUser(supabase: AuthClient) {
  const receipt = await readAuthFlow('password')
  if (!receipt) return null
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) return null
  const { data, error: claimsError } = await supabase.auth.getClaims()
  return !claimsError &&
    data?.claims.sub === user.id &&
    matchesPasswordReceipt(receipt, user.id, data.claims.session_id)
    ? user
    : null
}
