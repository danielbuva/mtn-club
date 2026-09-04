'use client'
import { useRef, useState } from 'react'
import { captchaRequestError } from '@/lib/auth/captcha'
import { authErrorMessage } from '@/lib/auth/errors'
import { finishAuthentication } from '@/lib/auth/notices'
import type { CredentialValues } from '@/lib/auth/password'
import { emailConfirmationRedirect } from '@/lib/auth/return-to'
import { createClient } from '@/lib/supabase/client'

export function useAuthActions(
  mode: 'login' | 'signup',
  returnTo: string,
  resetCaptcha: () => void,
) {
  const [pending, setPending] = useState<'email' | 'google' | 'discord' | null>(
    null,
  )
  const [error, setError] = useState<string | null>(null)
  const [needsConfirmation, setNeedsConfirmation] = useState(false)
  const busy = useRef(false)
  async function submit(
    values: CredentialValues,
    captchaToken: string,
    age18OrOlder = false,
  ) {
    if (busy.current) return
    const captchaError = captchaRequestError(captchaToken)
    if (captchaError) {
      setError(captchaError)
      return
    }
    busy.current = true
    setPending('email')
    setError(null)
    try {
      const supabase = createClient()
      const credentials = {
        email: values.email.trim().toLowerCase(),
        password: values.password,
        options: {
          captchaToken,
          emailRedirectTo: emailConfirmationRedirect(
            window.location.origin,
            returnTo,
          ),
          ...(mode === 'signup' && age18OrOlder
            ? { data: { age_18_or_older: true } }
            : {}),
        },
      }
      const result =
        mode === 'login'
          ? await supabase.auth.signInWithPassword(credentials)
          : await supabase.auth.signUp(credentials)
      if (result.error) throw result.error
      if (!result.data.session) {
        setNeedsConfirmation(true)
      } else {
        finishAuthentication(
          returnTo,
          mode === 'signup' ? 'created' : 'signed-in',
        )
        return
      }
    } catch (failure: unknown) {
      setError(authErrorMessage(failure))
    }
    resetCaptcha()
    busy.current = false
    setPending(null)
  }
  async function oauth(provider: 'google' | 'discord', age18OrOlder = false) {
    if (busy.current) return
    busy.current = true
    setPending(provider)
    setError(null)
    try {
      const callback = new URL('/auth/callback', window.location.origin)
      callback.searchParams.set('returnTo', returnTo)
      callback.searchParams.set('provider', provider)
      if (mode === 'signup' && age18OrOlder)
        callback.searchParams.set('age18', '1')
      const result = await createClient().auth.signInWithOAuth({
        provider,
        options: { redirectTo: callback.toString(), skipBrowserRedirect: true },
      })
      if (result.error) throw result.error
      if (!result.data.url) throw new Error('Missing provider URL')
      window.location.assign(result.data.url)
    } catch (failure: unknown) {
      setError(authErrorMessage(failure))
      busy.current = false
      setPending(null)
    }
  }
  return {
    pending,
    error,
    submit,
    oauth,
    needsConfirmation,
    editEmail: () => setNeedsConfirmation(false),
  }
}
