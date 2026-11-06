'use client'
import { AlertCircle } from 'lucide-react'
import { useActionState, useEffect, useRef, useState } from 'react'
import { signOutAction } from '@/app/actions/auth'
import {
  type ProfileNameState,
  saveProfileNameAction,
} from '@/app/auth/complete-profile/actions'
import {
  authButtonClass,
  authInputClass,
  FormMessage,
} from '@/components/auth/form-ui'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

const initialState: ProfileNameState = { error: null }

function NameField({
  name,
  label,
  autoComplete,
  value,
  onChange,
  error,
}: {
  name: 'firstName' | 'lastName'
  label: string
  autoComplete: string
  value: string
  onChange: (value: string) => void
  error?: string
}) {
  const errorId = `${name}-error`
  return (
    <div className="grid gap-2">
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        name={name}
        required
        maxLength={100}
        autoComplete={autoComplete}
        value={value}
        onChange={event => onChange(event.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        className={cn(
          authInputClass,
          error && 'border-[#b00000] dark:border-[#ff8a80]',
        )}
      />
      {error ? (
        <p
          id={errorId}
          className="flex items-center gap-1.5 text-sm text-foreground"
        >
          <AlertCircle
            aria-hidden="true"
            className="size-4 shrink-0 text-[#b00000] dark:text-[#ff8a80]"
          />
          {error}
        </p>
      ) : null}
    </div>
  )
}

export function ProfileNameForm({
  returnTo,
  initialFirstName,
  initialLastName,
}: {
  returnTo: string
  initialFirstName: string
  initialLastName: string
}) {
  const [state, action, pending] = useActionState(
    saveProfileNameAction,
    initialState,
  )
  const [firstName, setFirstName] = useState(initialFirstName)
  const [lastName, setLastName] = useState(initialLastName)
  const formRef = useRef<HTMLFormElement>(null)
  useEffect(() => {
    const field = state.fieldErrors?.firstName
      ? 'firstName'
      : state.fieldErrors?.lastName
        ? 'lastName'
        : null
    if (!field) return
    const input = formRef.current?.elements.namedItem(field)
    if (input instanceof HTMLElement) input.focus()
  }, [state])
  return (
    <>
      <form
        ref={formRef}
        action={action}
        noValidate
        className="space-y-5"
        aria-busy={pending}
      >
        {state.error ? <FormMessage>{state.error}</FormMessage> : null}
        <input type="hidden" name="returnTo" value={returnTo} />
        <div className="grid gap-5 sm:grid-cols-2">
          <NameField
            name="firstName"
            label="First name"
            autoComplete="given-name"
            value={firstName}
            onChange={setFirstName}
            error={state.fieldErrors?.firstName}
          />
          <NameField
            name="lastName"
            label="Last name"
            autoComplete="family-name"
            value={lastName}
            onChange={setLastName}
            error={state.fieldErrors?.lastName}
          />
        </div>
        <Button type="submit" className={authButtonClass} disabled={pending}>
          {pending ? 'Saving…' : 'Continue'}
        </Button>
      </form>
      <form action={signOutAction} className="mt-4 text-center">
        <button
          type="submit"
          className="inline-flex min-h-11 items-center text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
        >
          Not you? Sign out
        </button>
      </form>
    </>
  )
}
