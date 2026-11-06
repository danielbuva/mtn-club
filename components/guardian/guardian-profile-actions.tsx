'use client'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { updateGuardianPhoneAction } from '@/lib/guardian/participant-actions'
import type { GuardianStatus } from '@/lib/guardian/schema'
import { InviteForm } from './invite-form'
import { Field, InkButton, Notice, TextButton } from './ui'

export function GuardianPhone({ phone }: { phone: string | null }) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(phone ?? '')
  const [message, setMessage] = useState('')
  const [failed, setFailed] = useState(false)
  const [pending, start] = useTransition()
  if (!editing)
    return (
      <span className="flex flex-wrap items-baseline gap-x-4">
        <span>
          {phone ?? <span className="text-muted-foreground">Not added</span>}
        </span>
        <TextButton
          className="min-h-11 min-w-11 justify-center px-2 text-sm"
          onClick={() => setEditing(true)}
        >
          {phone ? 'Edit' : 'Add'}
        </TextButton>
        {message && !failed && (
          <span className="text-sm text-muted-foreground">{message}</span>
        )}
      </span>
    )
  return (
    <form
      noValidate
      className="space-y-3"
      onSubmit={event => {
        event.preventDefault()
        start(async () => {
          const result = await updateGuardianPhoneAction(value)
          setMessage(result.message)
          setFailed(!result.ok)
          if (result.ok) {
            setEditing(false)
            router.refresh()
          }
        })
      }}
    >
      <Field
        id="guardian-phone"
        label="Guardian’s phone"
        type="tel"
        inputMode="tel"
        autoComplete="off"
        maxLength={50}
        value={value}
        error={failed ? message : undefined}
        onChange={event => setValue(event.target.value)}
      />
      <div className="flex items-center gap-6">
        <InkButton type="submit" disabled={pending}>
          {pending ? 'Saving…' : 'Save'}
        </InkButton>
        <TextButton disabled={pending} onClick={() => setEditing(false)}>
          Cancel
        </TextButton>
      </div>
    </form>
  )
}

/** Name, email, or relationship changes designate a new guardian; history is kept. */
export function ChangeGuardian({
  guardian,
}: {
  guardian: NonNullable<GuardianStatus['guardian']>
}) {
  const [open, setOpen] = useState(false)
  if (!open)
    return (
      <TextButton onClick={() => setOpen(true)}>
        Change guardian or fix their email
      </TextButton>
    )
  return (
    <div className="space-y-4 border-l-2 border-foreground pl-4">
      <Notice tone="info">
        Changing the name, email, or relationship sends a new link. The new
        signer confirms their email, signs, and gets a club review. Past
        signatures stay on record.
      </Notice>
      <InviteForm
        tripId={null}
        guardian={guardian}
        onCancel={() => setOpen(false)}
        submitLabel="Send link to this guardian"
      />
    </div>
  )
}
