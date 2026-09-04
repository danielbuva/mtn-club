'use client'
import { useRef, useState } from 'react'
import { AuthCaptcha } from '@/components/auth/auth-captcha'
import { AuthTransitionLink } from '@/components/auth/auth-transition-link'
import {
  authButtonClass,
  EmailField,
  FormMessage,
} from '@/components/auth/form-ui'
import { Button } from '@/components/ui/button'
import { useResendCooldown } from '@/hooks/use-resend-cooldown'
import { captchaRequestError } from '@/lib/auth/captcha'
import { authErrorMessage, isRateLimitError } from '@/lib/auth/errors'
import { authHref, recoveryRedirect } from '@/lib/auth/return-to'
import { createClient } from '@/lib/supabase/client'

export function ForgotPasswordForm({ returnTo }: { returnTo: string }) {
  const [email, setEmail] = useState('')
  const [fieldError, setFieldError] = useState<string>()
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const [pending, setPending] = useState(false)
  const [captchaToken, setCaptchaToken] = useState('')
  const [captchaKey, setCaptchaKey] = useState(0)
  const busy = useRef(false)
  const cooldown = useResendCooldown()
  const validate = () =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
      ? undefined
      : 'Enter a valid email address.'
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy.current || cooldown.remaining > 0) return
    const invalid = validate()
    setFieldError(invalid)
    if (invalid) {
      const field = event.currentTarget.elements.namedItem('email')
      if (field instanceof HTMLElement) field.focus()
      return
    }
    const captchaError = captchaRequestError(captchaToken)
    if (captchaError) {
      setError(captchaError)
      return
    }
    busy.current = true
    setPending(true)
    setError(null)
    try {
      const result = await createClient().auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        {
          redirectTo: recoveryRedirect(window.location.origin, returnTo),
          captchaToken,
        },
      )
      if (result.error) throw result.error
      setSent(true)
      cooldown.start()
    } catch (failure: unknown) {
      setError(authErrorMessage(failure))
      if (isRateLimitError(failure)) cooldown.start()
    } finally {
      busy.current = false
      setPending(false)
      setCaptchaToken('')
      setCaptchaKey(key => key + 1)
    }
  }
  return (
    <div className="space-y-5">
      {sent && (
        <FormMessage success>
          If an account uses that email, a reset link is on its way. Check your
          inbox and spam folder. The link expires in one hour.
        </FormMessage>
      )}
      {error && <FormMessage>{error}</FormMessage>}
      <form noValidate onSubmit={submit} aria-busy={pending}>
        <fieldset disabled={pending} className="space-y-5">
          <legend className="sr-only">Request a password reset</legend>
          <EmailField
            id="recovery-email"
            value={email}
            error={fieldError}
            onChange={event => {
              setEmail(event.target.value)
              setSent(false)
              setFieldError(undefined)
            }}
            onBlur={() => setFieldError(validate())}
          />
          <AuthCaptcha
            key={captchaKey}
            action="password_reset"
            onTokenChange={setCaptchaToken}
            disabled={pending}
          />
          <Button
            type="submit"
            className={authButtonClass}
            disabled={pending || cooldown.remaining > 0}
          >
            {pending
              ? 'Sending reset link…'
              : cooldown.remaining > 0
                ? `Send again in ${cooldown.remaining}s`
                : sent
                  ? 'Send another reset link'
                  : 'Send reset link'}
          </Button>
        </fieldset>
      </form>
      <p className="text-center text-sm">
        <AuthTransitionLink
          disabled={pending}
          href={authHref('/auth/login', returnTo)}
        >
          Back to sign in
        </AuthTransitionLink>
      </p>
    </div>
  )
}
