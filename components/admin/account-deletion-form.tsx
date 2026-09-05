'use client'

import { Trash2 } from 'lucide-react'
import { useActionState, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function AccountDeletionForm({
  userId,
  email,
  action,
}: {
  userId: string
  email: string
  action: (
    previous: { error: string },
    data: FormData,
  ) => Promise<{ error: string }>
}) {
  const [state, formAction, pending] = useActionState(action, { error: '' })
  const [confirmation, setConfirmation] = useState('')
  return (
    <form action={formAction} className="mt-5 max-w-2xl space-y-3">
      <input type="hidden" name="userId" value={userId} />
      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          name="confirmation"
          type="email"
          required
          value={confirmation}
          onChange={event => setConfirmation(event.target.value)}
          placeholder={email}
          aria-label="Type account email to confirm deletion"
          aria-invalid={Boolean(state.error)}
          aria-describedby={state.error ? 'account-deletion-error' : undefined}
          disabled={pending}
        />
        <Button type="submit" variant="destructive" disabled={pending}>
          <Trash2 className="size-4" />{' '}
          {pending ? 'Deleting…' : 'Permanently delete'}
        </Button>
      </div>
      {state.error && (
        <p
          id="account-deletion-error"
          role="alert"
          className="text-sm text-destructive"
        >
          {state.error}
        </p>
      )}
    </form>
  )
}
