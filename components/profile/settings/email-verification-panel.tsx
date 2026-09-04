'use client'

import { CheckCircle2, Mail } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import {
  sendVerificationCode,
  verifyEmailCode,
} from '@/app/(site)/profile/(settings)/user/account/verification-actions'
import { AuthCaptcha } from '@/components/auth/auth-captcha'
import {
  authButtonClass,
  authInputClass,
  FormMessage,
} from '@/components/auth/form-ui'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useResendCooldown } from '@/hooks/use-resend-cooldown'
import type { EmailVerificationStatus } from '@/lib/auth/verification'

export function EmailVerificationPanel({
  email,
  status,
}: {
  email: string | null
  status: EmailVerificationStatus
}) {
  const [verified, setVerified] = useState(status.verified)
  const [sent, setSent] = useState(false)
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState<'send' | 'verify' | null>(null)
  const [captchaToken, setCaptchaToken] = useState('')
  const [captchaKey, setCaptchaKey] = useState(0)
  const busy = useRef(false)
  const codeInput = useRef<HTMLInputElement>(null)
  const { remaining: seconds, start } = useResendCooldown()
  useEffect(() => {
    if (sent) codeInput.current?.focus()
  }, [sent])

  async function send() {
    if (busy.current || seconds > 0) return
    busy.current = true
    setPending('send')
    setError(null)
    try {
      const result = await sendVerificationCode(captchaToken)
      if (result.retryAfter) start()
      if (result.error) setError(result.error)
      else if (result.verified) setVerified(true)
      else {
        setSent(true)
        setCode('')
        start()
      }
    } catch {
      setError('Couldn’t connect. Check your connection and try again.')
    } finally {
      setCaptchaToken('')
      setCaptchaKey(key => key + 1)
      setPending(null)
      busy.current = false
    }
  }

  async function verify(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy.current) return
    if (!/^\d{6}$/.test(code)) {
      setError('Enter the six-digit code from your email.')
      codeInput.current?.focus()
      return
    }
    busy.current = true
    setPending('verify')
    setError(null)
    try {
      const result = await verifyEmailCode(code)
      if (result.error) setError(result.error)
      else setVerified(Boolean(result.verified))
    } catch {
      setError('Couldn’t connect. Check your connection and try again.')
    } finally {
      setPending(null)
      busy.current = false
    }
  }

  return (
    <section
      id="email-verification"
      aria-labelledby="verification-title"
      className="scroll-mt-24 rounded-xl border border-border/60 bg-card/80 p-4 sm:p-6"
    >
      <h2
        id="verification-title"
        className="flex items-center gap-2 text-lg font-semibold"
      >
        {verified ? (
          <CheckCircle2 className="size-5" aria-hidden="true" />
        ) : (
          <Mail className="size-5" aria-hidden="true" />
        )}{' '}
        Email verification
      </h2>
      <p className="mt-2 break-words text-sm text-muted-foreground">
        {email ?? 'No email address on this account.'}
      </p>
      {verified ? (
        <p aria-live="polite" className="mt-3 text-sm">
          Your email is verified. You’re all set.
        </p>
      ) : (
        email && (
          <div className="mt-4 max-w-md space-y-4">
            <p className="text-sm leading-6 text-muted-foreground">
              Confirm that you can receive club emails. This is optional and
              doesn’t affect your membership or access.
            </p>
            {error && (
              <FormMessage id="verification-error">{error}</FormMessage>
            )}
            {sent && (
              <form noValidate onSubmit={verify} className="space-y-3">
                <p aria-live="polite" className="text-sm">
                  Code sent. Check your inbox and spam folder. It expires in one
                  hour.
                </p>
                <div className="space-y-2">
                  <Label htmlFor="verification-code">
                    Six-digit verification code
                  </Label>
                  <Input
                    ref={codeInput}
                    id="verification-code"
                    name="code"
                    value={code}
                    onChange={event =>
                      setCode(event.target.value.replace(/\s/g, ''))
                    }
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="[0-9]{6}"
                    className={authInputClass}
                    disabled={pending !== null}
                    aria-invalid={Boolean(error)}
                    aria-describedby={error ? 'verification-error' : undefined}
                  />
                </div>
                <Button
                  type="submit"
                  className={authButtonClass}
                  disabled={pending !== null}
                >
                  {pending === 'verify' ? 'Verifying…' : 'Verify email'}
                </Button>
              </form>
            )}
            <AuthCaptcha
              key={captchaKey}
              action="email_verification"
              onTokenChange={setCaptchaToken}
            />
            <Button
              type="button"
              variant="outline"
              className={authButtonClass}
              onClick={send}
              disabled={pending !== null || seconds > 0 || !captchaToken}
            >
              {pending === 'send'
                ? 'Sending…'
                : seconds > 0
                  ? `Resend in ${seconds}s`
                  : sent
                    ? 'Resend verification code'
                    : 'Send verification code'}
            </Button>
          </div>
        )
      )}
    </section>
  )
}
