'use client'
import { useActionState } from 'react'
import { confirmEmailAction } from '@/app/auth/confirm/actions'
import { AuthTransitionLink } from '@/components/auth/auth-transition-link'
import { authButtonClass, FormMessage } from '@/components/auth/form-ui'
import { Button } from '@/components/ui/button'
import { authHref } from '@/lib/auth/return-to'
export function ConfirmationForm({
  tokenHash,
  type,
  returnTo,
}: {
  tokenHash: string
  type: string
  returnTo: string
}) {
  const [state, action, pending] = useActionState(confirmEmailAction, {
    error: null,
  })
  const recovery = type === 'recovery' || type === 'invite'
  return (
    <div className="space-y-5">
      {state.error ? (
        <FormMessage>{state.error}</FormMessage>
      ) : (
        <p className="text-sm leading-6 text-muted-foreground">
          {recovery
            ? 'Continue to securely choose your new password.'
            : 'Confirm this email action to continue to Mountain Club.'}{' '}
          This link can be used once.
        </p>
      )}
      {!state.error && (
        <form action={action} aria-busy={pending}>
          <input type="hidden" name="tokenHash" value={tokenHash} />
          <input type="hidden" name="type" value={type} />
          <input type="hidden" name="returnTo" value={returnTo} />
          <Button className={authButtonClass} disabled={pending}>
            {pending
              ? 'Verifying link…'
              : recovery
                ? 'Continue to new password'
                : 'Confirm and continue'}
          </Button>
        </form>
      )}
      <AuthTransitionLink
        disabled={pending}
        href={authHref(
          recovery ? '/auth/forgot-password' : '/auth/login',
          returnTo,
        )}
      >
        {recovery ? 'Request a new reset link' : 'Back to sign in'}
      </AuthTransitionLink>
    </div>
  )
}
