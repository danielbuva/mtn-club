'use server'
import { redirect } from 'next/navigation'
import { parseEmailOtpType } from '@/lib/auth/confirmation'
import { recordConfirmedEmail } from '@/lib/auth/confirmed-email-proof'
import { authErrorMessage } from '@/lib/auth/errors'
import { setAuthFlow } from '@/lib/auth/flow-cookies'
import { verifyRecoveryLink } from '@/lib/auth/recovery-policy'
import { authHref, sanitizeReturnTo } from '@/lib/auth/return-to'
import { createClient } from '@/lib/supabase/server'
export type ConfirmState = { error: string | null }
export async function confirmEmailAction(
  _previous: ConfirmState,
  formData: FormData,
): Promise<ConfirmState> {
  const tokenHash = String(formData.get('tokenHash') ?? '')
  const type = parseEmailOtpType(String(formData.get('type') ?? ''))
  const returnTo =
    sanitizeReturnTo(String(formData.get('returnTo') ?? '/')) ?? '/'
  if (!tokenHash || !type)
    return { error: 'This link is incomplete. Please request a new email.' }
  try {
    const supabase = await createClient()
    const recovery = type === 'recovery' || type === 'invite'
    const result = recovery
      ? await verifyRecoveryLink(supabase, tokenHash, type)
      : await supabase.auth.verifyOtp({ type, token_hash: tokenHash })
    const { data, error } = result
    if (error) return { error: authErrorMessage(error) }
    if (data.user && type !== 'email_change')
      await recordConfirmedEmail(data.user)
    if (recovery) {
      if (!('receipt' in result) || !result.receipt)
        return {
          error:
            'This email could not start a password reset. Request a fresh reset link.',
        }
      await setAuthFlow('password', result.receipt)
    } else if (data.user) {
      await setAuthFlow('arrival', {
        userId: data.user.id,
        outcome: 'signed-in',
      })
    }
  } catch {
    return {
      error:
        'We could not verify this link. Check your connection and try again.',
    }
  }
  redirect(
    type === 'recovery' || type === 'invite'
      ? authHref('/auth/update-password', returnTo)
      : returnTo,
  )
}
