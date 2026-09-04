'use client'
import { useState } from 'react'
import { AuthCaptcha } from '@/components/auth/auth-captcha'
import { AuthTransitionLink } from '@/components/auth/auth-transition-link'
import {
  authButtonClass,
  EmailField,
  FormMessage,
} from '@/components/auth/form-ui'
import { PasswordField } from '@/components/auth/password-field'
import { SignupConfirmation } from '@/components/auth/signup-confirmation'
import { Button } from '@/components/ui/button'
import { useAuthActions } from '@/hooks/use-auth-actions'
import {
  type CredentialField,
  type CredentialValues,
  validateCredentials,
} from '@/lib/auth/password'
import { authHref } from '@/lib/auth/return-to'

export function CredentialsForm({
  mode,
  returnTo,
}: {
  mode: 'login' | 'signup'
  returnTo: string
}) {
  const signup = mode === 'signup'
  const [values, setValues] = useState<CredentialValues>({
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [touched, setTouched] = useState<
    Partial<Record<CredentialField, boolean>>
  >({})
  const [captchaToken, setCaptchaToken] = useState('')
  const [captchaKey, setCaptchaKey] = useState(0)
  const actions = useAuthActions(mode, returnTo, () => {
    setCaptchaToken('')
    setCaptchaKey(key => key + 1)
  })
  const errors = validateCredentials(values, mode)
  const fieldProps = (field: CredentialField) => ({
    id: `${mode}-${field}`,
    name: field,
    value: values[field],
    error: touched[field] ? errors[field] : undefined,
    onChange: (event: React.ChangeEvent<HTMLInputElement>) =>
      setValues(current => ({ ...current, [field]: event.target.value })),
    onBlur: () => setTouched(current => ({ ...current, [field]: true })),
  })
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setTouched({ email: true, password: true, confirmPassword: true })
    const firstInvalid = (
      ['email', 'password', 'confirmPassword'] as const
    ).find(field => errors[field])
    if (firstInvalid) {
      const input = event.currentTarget.elements.namedItem(firstInvalid)
      if (input instanceof HTMLElement) input.focus()
      return
    }
    await actions.submit(values, captchaToken)
  }
  if (actions.needsConfirmation)
    return (
      <SignupConfirmation
        email={values.email.trim()}
        returnTo={returnTo}
        onEdit={actions.editEmail}
      />
    )
  return (
    <div className="space-y-5">
      <section className="grid gap-3" aria-label="Social sign-in">
        <Button
          type="button"
          variant="outline"
          className={authButtonClass}
          disabled={actions.pending !== null}
          onClick={() => actions.oauth('google')}
        >
          <span aria-hidden="true" className="text-lg font-bold">
            G
          </span>
          {actions.pending === 'google'
            ? 'Opening Google…'
            : 'Continue with Google'}
        </Button>
        <Button
          type="button"
          variant="outline"
          className={authButtonClass}
          disabled={actions.pending !== null}
          onClick={() => actions.oauth('discord')}
        >
          {actions.pending === 'discord'
            ? 'Opening Discord…'
            : 'Continue with Discord'}
        </Button>
      </section>
      <p className="text-center text-xs leading-5 text-muted-foreground">
        Already a member? Use a sign-in method you’ve used before. You can
        connect more methods in Account settings.
      </p>
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        or continue with email
        <span className="h-px flex-1 bg-border" />
      </div>
      {actions.error && <FormMessage>{actions.error}</FormMessage>}
      <form
        noValidate
        onSubmit={handleSubmit}
        aria-busy={actions.pending !== null}
      >
        <fieldset disabled={actions.pending !== null} className="space-y-5">
          <legend className="sr-only">
            {signup ? 'Create an account with email' : 'Sign in with email'}
          </legend>
          <EmailField {...fieldProps('email')} />
          <PasswordField
            {...fieldProps('password')}
            label="Password"
            autoComplete={signup ? 'new-password' : 'current-password'}
            showRequirements={signup}
          />
          {signup ? (
            <PasswordField
              {...fieldProps('confirmPassword')}
              label="Confirm password"
            />
          ) : (
            <div className="-mt-2 text-right">
              <AuthTransitionLink
                disabled={actions.pending !== null}
                href={authHref('/auth/forgot-password', returnTo)}
              >
                Forgot password?
              </AuthTransitionLink>
            </div>
          )}
          {signup &&
            values.confirmPassword &&
            values.confirmPassword === values.password && (
              <p aria-live="polite" className="text-sm text-muted-foreground">
                Passwords match.
              </p>
            )}
          <AuthCaptcha
            key={captchaKey}
            action={mode}
            onTokenChange={setCaptchaToken}
            disabled={actions.pending !== null}
          />
          <Button
            type="submit"
            className={authButtonClass}
            disabled={actions.pending !== null}
          >
            {actions.pending === 'email'
              ? signup
                ? 'Creating your account…'
                : 'Signing in…'
              : signup
                ? 'Create account'
                : 'Sign in'}
          </Button>
        </fieldset>
      </form>
      {signup && (
        <p className="text-sm leading-6 text-muted-foreground">
          Creating an account is free. Club membership and dues are separate.
        </p>
      )}
      <p className="text-center text-sm">
        {signup ? 'Already have an account? ' : 'New to Mountain Club? '}
        <AuthTransitionLink
          disabled={actions.pending !== null}
          href={authHref(signup ? '/auth/login' : '/auth/sign-up', returnTo)}
        >
          {signup ? 'Sign in' : 'Create an account'}
        </AuthTransitionLink>
      </p>
    </div>
  )
}
