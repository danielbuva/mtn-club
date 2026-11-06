'use client'
import { useEffect, useRef, useState } from 'react'
import { GuardianHeading } from './guardian-shell'
import { Field, InkButton, Notice, TextButton } from './ui'

const COOLDOWN = 45

export function VerifyStep({
  email,
  stepLabel,
  onVerify,
  onResend,
  onChangeEmail,
  pending,
  message,
  info,
  purpose,
}: {
  email: string
  stepLabel?: string
  onVerify: (code: string) => void
  onResend: () => void
  onChangeEmail: () => void
  pending: boolean
  message: string
  info: string
  purpose: string
}) {
  const [code, setCode] = useState('')
  const [remaining, setRemaining] = useState(COOLDOWN)
  const deadline = useRef(Date.now() + COOLDOWN * 1000)
  useEffect(() => {
    if (remaining <= 0) return
    const timer = window.setTimeout(
      () =>
        setRemaining(
          Math.max(0, Math.ceil((deadline.current - Date.now()) / 1000)),
        ),
      1000,
    )
    return () => window.clearTimeout(timer)
  }, [remaining])
  return (
    <form
      noValidate
      className="space-y-8"
      onSubmit={event => {
        event.preventDefault()
        onVerify(code)
      }}
    >
      <GuardianHeading eyebrow={stepLabel} title="Check your email.">
        <p>
          We sent a 6-digit code to{' '}
          <strong className="font-semibold [overflow-wrap:anywhere]">
            {email}
          </strong>
          . Enter it to {purpose}.
        </p>
      </GuardianHeading>
      <div className="sm:max-w-xs">
        <Field
          id="g-code"
          label="6-digit code"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]*"
          maxLength={6}
          value={code}
          error={message || undefined}
          className="font-mono text-2xl tracking-[0.4em]"
          onChange={event =>
            setCode(event.target.value.replace(/\D/g, '').slice(0, 6))
          }
          disabled={pending}
        />
      </div>
      <Notice tone="info">{info}</Notice>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
        <InkButton
          type="submit"
          disabled={pending || code.length !== 6}
          className="w-full sm:w-auto"
        >
          {pending ? 'Checking…' : 'Confirm code'}
        </InkButton>
        <TextButton
          disabled={pending || remaining > 0}
          onClick={() => {
            deadline.current = Date.now() + COOLDOWN * 1000
            setRemaining(COOLDOWN)
            setCode('')
            onResend()
          }}
        >
          {remaining > 0
            ? `Send a new code in ${remaining}s`
            : 'Send a new code'}
        </TextButton>
        <TextButton disabled={pending} onClick={onChangeEmail}>
          Use a different email
        </TextButton>
      </div>
      <p className="max-w-xl text-sm leading-6 text-muted-foreground">
        Codes expire after 10 minutes. This confirms you can open this inbox. It
        isn’t an ID check.
      </p>
    </form>
  )
}
