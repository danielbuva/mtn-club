'use client'
import Link from 'next/link'
import { useRef, useState } from 'react'
import { AuthCaptcha } from '@/components/auth/auth-captcha'
import { authButtonClass, FormMessage } from '@/components/auth/form-ui'
import { Button } from '@/components/ui/button'
import { useResendCooldown } from '@/hooks/use-resend-cooldown'
import { captchaRequestError } from '@/lib/auth/captcha'
import { authErrorMessage } from '@/lib/auth/errors'
import { authHref, emailConfirmationRedirect } from '@/lib/auth/return-to'
import { createClient } from '@/lib/supabase/client'

export function SignupConfirmation({
  email,
  returnTo,
  onEdit,
}: {
  email: string
  returnTo: string
  onEdit: () => void
}) {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const [token, setToken] = useState('')
  const [captchaKey, setCaptchaKey] = useState(0)
  const cooldown = useResendCooldown(60)
  const busy = useRef(false)
  async function resend() {
    if (busy.current || cooldown.remaining > 0) return
    const invalid = captchaRequestError(token)
    if (invalid) {
      setError(invalid)
      return
    }
    busy.current = true
    setPending(true)
    setError(null)
    try {
      const { error: failure } = await createClient().auth.resend({
        type: 'signup',
        email: email.trim().toLowerCase(),
        options: {
          captchaToken: token,
          emailRedirectTo: emailConfirmationRedirect(
            window.location.origin,
            returnTo,
          ),
        },
      })
      if (failure) setError(authErrorMessage(failure))
      else setSent(true)
      cooldown.start()
    } catch {
      setError(
        'We could not request the email. Check your connection and try again.',
      )
    } finally {
      busy.current = false
      setPending(false)
      setToken('')
      setCaptchaKey(key => key + 1)
    }
  }
  return (
    <section
      className="space-y-5"
      aria-label="Check your email"
      aria-busy={pending}
    >
      <FormMessage success>
        Check your inbox. If this address can be registered, a confirmation
        email is on its way.
      </FormMessage>
      <p className="break-words text-sm leading-6 text-muted-foreground">
        Open the email sent to{' '}
        <span className="font-medium text-foreground">{email}</span> and confirm
        to continue. Check your spam folder too. Already registered? Sign in
        using a method you’ve used before.
      </p>
      {error && <FormMessage>{error}</FormMessage>}
      {sent && (
        <FormMessage success>
          Email requested. Give it a minute to arrive.
        </FormMessage>
      )}
      <AuthCaptcha
        key={captchaKey}
        action="signup_resend"
        onTokenChange={setToken}
        disabled={pending}
      />
      <Button
        className={authButtonClass}
        variant="outline"
        disabled={pending || cooldown.remaining > 0}
        onClick={resend}
      >
        {pending
          ? 'Requesting email…'
          : cooldown.remaining > 0
            ? `Send again in ${cooldown.remaining}s`
            : 'Resend confirmation email'}
      </Button>
      <Button
        className={authButtonClass}
        variant="ghost"
        disabled={pending}
        onClick={onEdit}
      >
        Use a different email
      </Button>
      {!pending && (
        <div className="flex flex-wrap justify-between gap-3 text-sm">
          <Link
            className="inline-flex min-h-12 items-center underline"
            href={authHref('/auth/login', returnTo)}
          >
            Back to sign in
          </Link>
          <Link
            className="inline-flex min-h-12 items-center underline"
            href={authHref('/auth/forgot-password', returnTo)}
          >
            Reset password
          </Link>
        </div>
      )}
    </section>
  )
}
