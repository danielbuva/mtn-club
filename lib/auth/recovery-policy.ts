import type { SupabaseClient } from '@supabase/supabase-js'

export function hasRecentRecoveryProof(
  amr: unknown,
  now = Date.now(),
): boolean {
  return (
    Array.isArray(amr) &&
    amr.some(
      (entry: unknown) =>
        typeof entry === 'object' &&
        entry !== null &&
        'method' in entry &&
        (entry.method === 'recovery' || entry.method === 'invite') &&
        'timestamp' in entry &&
        typeof entry.timestamp === 'number' &&
        entry.timestamp * 1000 <= now + 30_000 &&
        entry.timestamp * 1000 > now - 15 * 60_000,
    )
  )
}

// POST /verify uses `otp` AMR even for recovery/invite. Unlike a PKCE
// exchange, its claims alone cannot distinguish a reset from signup/OTP.
// Establish provenance here by verifying the actual reset token server-side;
// never accept a browser flag or an existing OTP session as reset proof.
export async function verifyRecoveryLink(
  supabase: Pick<SupabaseClient, 'auth'>,
  tokenHash: string,
  type: 'recovery' | 'invite',
) {
  const verified = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type,
  })
  if (verified.error || !verified.data.session || !verified.data.user)
    return { ...verified, receipt: null }
  const { data, error } = await supabase.auth.getClaims(
    verified.data.session.access_token,
  )
  const claims = data?.claims
  const recentOtp =
    Array.isArray(claims?.amr) &&
    claims.amr.some(
      entry =>
        typeof entry === 'object' &&
        entry !== null &&
        entry.method === 'otp' &&
        Number.isFinite(entry.timestamp) &&
        entry.timestamp * 1000 <= Date.now() + 30_000 &&
        entry.timestamp * 1000 > Date.now() - 15 * 60_000,
    )
  const receipt =
    !error &&
    claims?.sub === verified.data.user.id &&
    typeof claims.session_id === 'string' &&
    claims.session_id &&
    recentOtp
      ? { userId: claims.sub, sessionId: claims.session_id }
      : null
  return { ...verified, receipt }
}

export function matchesPasswordReceipt(
  receipt: Record<string, unknown> | null,
  userId: string,
  sessionId: unknown,
) {
  return (
    typeof sessionId === 'string' &&
    sessionId.length > 0 &&
    receipt?.userId === userId &&
    receipt?.sessionId === sessionId
  )
}
