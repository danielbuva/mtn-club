'use server'
import { revalidatePath } from 'next/cache'
import { authErrorMessage } from '@/lib/auth/errors'
import { clearAuthFlow } from '@/lib/auth/flow-cookies'
import { passwordError } from '@/lib/auth/password'
import { passwordResetUser } from '@/lib/auth/recovery-session'
import { createClient } from '@/lib/supabase/server'

export async function saveRecoveredPassword(password: string, confirm: string) {
  if (typeof password !== 'string' || typeof confirm !== 'string')
    return { error: 'Enter and confirm your new password.' }
  const invalid = passwordError(password)
  if (invalid) return { error: invalid }
  if (password !== confirm) return { error: 'Passwords do not match.' }
  try {
    const supabase = await createClient()
    if (!(await passwordResetUser(supabase)))
      return {
        error:
          'This reset session has expired. Request a fresh email link to continue.',
      }
    const { error } = await supabase.auth.updateUser({ password })
    if (error) return { error: authErrorMessage(error) }
    await clearAuthFlow('password')
    revalidatePath('/profile/user/account')
    return { error: null }
  } catch {
    return {
      error:
        'We could not save the password. Check your connection and try again.',
    }
  }
}
