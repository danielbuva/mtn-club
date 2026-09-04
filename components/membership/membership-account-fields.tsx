'use client'

import { useEffect, useRef, useState } from 'react'
import { AuthCaptcha } from '@/components/auth/auth-captcha'
import { EmailField } from '@/components/auth/form-ui'
import { PasswordField } from '@/components/auth/password-field'
import { Button } from '@/components/ui/button'
import { authErrorMessage } from '@/lib/auth/errors'
import { PASSWORD_MIN_LENGTH, passwordError } from '@/lib/auth/password'
import { createClient } from '@/lib/supabase/client'

const inputClass =
  'rounded-none border-[#211D18]/35 bg-transparent text-[#211D18] shadow-none focus-visible:ring-[#211D18] focus-visible:ring-offset-[#F8F1DF]'
const retainCaptchaToken = (_token: string) => undefined

export function MembershipAccountFields({
  captchaResetKey,
}: {
  captchaResetKey: number
}) {
  const [password, setPassword] = useState('')
  const [repeatPassword, setRepeatPassword] = useState('')
  const [passwordTouched, setPasswordTouched] = useState(false)
  const [repeatTouched, setRepeatTouched] = useState(false)
  const [providerPending, setProviderPending] = useState<
    'google' | 'discord' | null
  >(null)
  const [providerError, setProviderError] = useState<string | null>(null)
  const repeatPasswordRef = useRef<HTMLInputElement>(null)
  const passwordMessage = passwordTouched ? passwordError(password) : undefined
  const repeatMessage =
    repeatTouched && repeatPassword !== password
      ? 'Passwords do not match.'
      : undefined

  useEffect(() => {
    repeatPasswordRef.current?.setCustomValidity(
      repeatPassword && repeatPassword !== password
        ? 'Passwords do not match.'
        : '',
    )
  }, [password, repeatPassword])

  async function continueWith(provider: 'google' | 'discord') {
    if (providerPending) return
    setProviderPending(provider)
    setProviderError(null)
    try {
      const callback = new URL('/auth/callback', window.location.origin)
      callback.searchParams.set('returnTo', '/membership-sign-up')
      callback.searchParams.set('provider', provider)
      const result = await createClient().auth.signInWithOAuth({
        provider,
        options: { redirectTo: callback.toString(), skipBrowserRedirect: true },
      })
      if (result.error) throw result.error
      if (!result.data.url) throw new Error('Missing provider URL')
      window.location.assign(result.data.url)
    } catch (error: unknown) {
      setProviderError(authErrorMessage(error))
      setProviderPending(null)
    }
  }

  return (
    <fieldset
      disabled={providerPending !== null}
      aria-busy={providerPending !== null}
      className="grid gap-5 border-t border-[#211D18]/20 pt-7"
    >
      <legend className="font-brand text-3xl uppercase">Your account</legend>
      <p className="max-w-2xl text-sm leading-6 text-[#211D18]/65">
        Your email becomes your Mountain Club login and the contact address for
        this application.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Button
          type="button"
          variant="outline"
          disabled={providerPending !== null}
          onClick={() => continueWith('google')}
          className="min-h-12 rounded-none border-[#211D18]/35 bg-transparent text-base font-semibold text-[#211D18] hover:bg-[#E9DDC3]"
        >
          <span aria-hidden="true" className="text-lg font-bold">
            G
          </span>
          {providerPending === 'google'
            ? 'Opening Google…'
            : 'Continue with Google'}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={providerPending !== null}
          onClick={() => continueWith('discord')}
          className="min-h-12 rounded-none border-[#211D18]/35 bg-transparent text-base font-semibold text-[#211D18] hover:bg-[#E9DDC3]"
        >
          {providerPending === 'discord'
            ? 'Opening Discord…'
            : 'Continue with Discord'}
        </Button>
      </div>
      <p className="text-sm leading-6 text-[#211D18]/65">
        Google or Discord returns you here signed in so you can finish the
        application. Use a sign-in method you already connected if you have an
        account.
      </p>
      {providerError ? (
        <div
          role="alert"
          className="border border-red-900/25 bg-red-50 p-3 text-sm text-red-900"
        >
          {providerError}
        </div>
      ) : null}
      <div className="flex items-center gap-4 text-xs text-[#211D18]/55">
        <span className="h-px flex-1 bg-[#211D18]/20" />
        or create an account with email
        <span className="h-px flex-1 bg-[#211D18]/20" />
      </div>
      <EmailField
        id="contactEmail"
        name="contactEmail"
        className={inputClass}
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <PasswordField
          id="membership-password"
          name="password"
          label="Password"
          value={password}
          minLength={PASSWORD_MIN_LENGTH}
          onChange={event => setPassword(event.currentTarget.value)}
          onBlur={() => setPasswordTouched(true)}
          error={passwordMessage}
          showRequirements
          className={inputClass}
        />
        <PasswordField
          id="membership-repeat-password"
          name="repeatPassword"
          ref={repeatPasswordRef}
          label="Confirm password"
          value={repeatPassword}
          minLength={PASSWORD_MIN_LENGTH}
          onChange={event => setRepeatPassword(event.currentTarget.value)}
          onBlur={() => {
            setRepeatTouched(true)
          }}
          error={repeatMessage}
          className={inputClass}
        />
      </div>
      {repeatPassword && repeatPassword === password ? (
        <p aria-live="polite" className="text-sm text-[#211D18]/65">
          Passwords match.
        </p>
      ) : null}
      <div className="max-w-sm">
        <AuthCaptcha
          key={captchaResetKey}
          action="membership-signup"
          onTokenChange={retainCaptchaToken}
        />
      </div>
    </fieldset>
  )
}
