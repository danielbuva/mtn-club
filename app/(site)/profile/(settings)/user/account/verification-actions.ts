'use server'

import { revalidatePath } from 'next/cache'
import { captchaRequestError } from '@/lib/auth/captcha'
import { authErrorMessage, isRateLimitError } from '@/lib/auth/errors'
import { getEmailVerificationStatus } from '@/lib/auth/verification'
import {
  type VerificationResult,
  verifyEmailProof,
} from '@/lib/auth/verify-email-proof'
import { createAdminClient } from '@/lib/supabase/admin'
import { createPublicClient } from '@/lib/supabase/public'
import { createClient } from '@/lib/supabase/server'

export async function sendVerificationCode(
  captchaToken: string,
): Promise<VerificationResult> {
  const captchaError = captchaRequestError(captchaToken)
  if (captchaError) return { error: captchaError }
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user?.email) return { error: 'Sign in again to verify your email.' }
    if (getEmailVerificationStatus(user).verified)
      return { error: null, verified: true }
    // Fail before sending a code when protected metadata cannot be written.
    createAdminClient()
    const transient = createPublicClient()
    const { error } = await transient.auth.signInWithOtp({
      email: user.email,
      options: { shouldCreateUser: false, captchaToken },
    })
    return {
      error: error ? authErrorMessage(error) : null,
      retryAfter: isRateLimitError(error) ? 60 : undefined,
    }
  } catch {
    return {
      error:
        'We couldn’t send a code. Try again shortly or contact club support.',
    }
  }
}

export async function verifyEmailCode(
  code: string,
): Promise<VerificationResult> {
  if (!/^\d{6}$/.test(code))
    return { error: 'Enter the six-digit code from your email.' }
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user?.email) return { error: 'Sign in again to verify your email.' }
    const admin = createAdminClient()
    // This client has no cookie adapter or persistent storage. OTP sessions must
    // never replace the signed-in browser session, including on an ID mismatch.
    const transient = createPublicClient()
    const result = await verifyEmailProof(user, code, {
      verify: async (email, token) => {
        const { data, error } = await transient.auth.verifyOtp({
          email,
          token,
          type: 'email',
        })
        return {
          user: data.user,
          error: error ? authErrorMessage(error) : null,
        }
      },
      currentAccount: async id => {
        const { data, error } = await admin.auth.admin.getUserById(id)
        return error ? null : data.user
      },
      saveMetadata: async (id, app_metadata) => {
        const { error } = await admin.auth.admin.updateUserById(id, {
          app_metadata,
        })
        return !error
      },
    })
    if (!result.verified) return result
    revalidatePath('/profile/user/account')
    return { error: null, verified: true }
  } catch {
    return {
      error: 'Verification is unavailable right now. Try again shortly.',
    }
  }
}
