'use client'
import Link from 'next/link'
import { useRef, useState } from 'react'
import { saveRecoveredPassword } from '@/app/auth/update-password/actions'
import { authButtonClass, FormMessage } from '@/components/auth/form-ui'
import { PasswordField } from '@/components/auth/password-field'
import { Button } from '@/components/ui/button'
import { authErrorMessage } from '@/lib/auth/errors'
import { finishAuthentication } from '@/lib/auth/notices'
import { passwordError } from '@/lib/auth/password'
import { authHref } from '@/lib/auth/return-to'

export function UpdatePasswordForm({
  returnTo,
  email,
}: {
  returnTo: string
  email: string | null
}) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [touched, setTouched] = useState({ password: false, confirm: false })
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const busy = useRef(false)
  const invalidPassword = passwordError(password)
  const invalidConfirm =
    password !== confirm ? 'Passwords do not match.' : undefined
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy.current) return
    setTouched({ password: true, confirm: true })
    if (invalidPassword || invalidConfirm) {
      const input = event.currentTarget.elements.namedItem(
        invalidPassword ? 'password' : 'confirmPassword',
      )
      if (input instanceof HTMLElement) input.focus()
      return
    }
    busy.current = true
    setPending(true)
    setError(null)
    try {
      const result = await saveRecoveredPassword(password, confirm)
      if (result.error) {
        setError(result.error)
        busy.current = false
        setPending(false)
        return
      }
      finishAuthentication(returnTo, 'password-updated')
    } catch (failure: unknown) {
      setError(authErrorMessage(failure))
      busy.current = false
      setPending(false)
    }
  }
  return (
    <form
      noValidate
      onSubmit={submit}
      aria-busy={pending}
      className="space-y-5"
    >
      {email && (
        <p className="break-words text-sm text-muted-foreground">
          Setting a new password for{' '}
          <span className="font-medium text-foreground">{email}</span>.
        </p>
      )}
      {error && (
        <FormMessage>
          {error}{' '}
          <Link
            href={authHref('/auth/forgot-password', returnTo)}
            className="inline-flex min-h-11 items-center underline"
          >
            Request a new reset link
          </Link>
        </FormMessage>
      )}
      <fieldset disabled={pending} className="space-y-5">
        <legend className="sr-only">Choose a new password</legend>
        <PasswordField
          id="password"
          label="New password"
          value={password}
          error={touched.password ? invalidPassword : undefined}
          onChange={event => setPassword(event.target.value)}
          onBlur={() => setTouched(current => ({ ...current, password: true }))}
          showRequirements
        />
        <PasswordField
          id="confirmPassword"
          label="Confirm new password"
          value={confirm}
          error={touched.confirm ? invalidConfirm : undefined}
          onChange={event => setConfirm(event.target.value)}
          onBlur={() => setTouched(current => ({ ...current, confirm: true }))}
        />
        {confirm && confirm === password && (
          <p aria-live="polite" className="text-sm text-muted-foreground">
            Passwords match.
          </p>
        )}
        <Button type="submit" className={authButtonClass}>
          {pending ? 'Saving new password…' : 'Save new password'}
        </Button>
      </fieldset>
    </form>
  )
}
