'use client'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import {
  type InviteFieldErrors,
  sendInviteAction,
} from '@/lib/guardian/participant-actions'
import type { GuardianStatus } from '@/lib/guardian/schema'
import { focusFirstError } from './focus'
import { Field, InkButton, Notice, TextButton } from './ui'

export function InviteForm({
  tripId,
  guardian,
  onCancel,
  submitLabel = 'Send link',
}: {
  tripId: string | null
  guardian: GuardianStatus['guardian']
  onCancel?: () => void
  submitLabel?: string
}) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [values, setValues] = useState({
    name: guardian?.name ?? '',
    email: guardian?.email ?? '',
    relationship: guardian?.relationship ?? '',
  })
  const [errors, setErrors] = useState<InviteFieldErrors>({})
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState('')
  return (
    <form
      noValidate
      className="space-y-5"
      onSubmit={event => {
        event.preventDefault()
        const form = event.currentTarget
        start(async () => {
          const result = await sendInviteAction(values, tripId)
          setErrors(result.fieldErrors ?? {})
          if (result.ok) {
            setSent(result.message)
            setMessage('')
            router.refresh()
          } else {
            setMessage(result.message)
            focusFirstError(form)
          }
        })
      }}
    >
      <fieldset disabled={pending} className="grid gap-5 sm:grid-cols-2">
        <legend className="sr-only">Your parent or guardian</legend>
        <Field
          id="invite-name"
          label="Their full name"
          autoComplete="off"
          maxLength={200}
          value={values.name}
          error={errors.name}
          onChange={event => setValues({ ...values, name: event.target.value })}
        />
        <Field
          id="invite-relationship"
          label="They’re your…"
          placeholder="Mother, Father, Legal guardian"
          autoComplete="off"
          maxLength={80}
          value={values.relationship}
          error={errors.relationship}
          onChange={event =>
            setValues({ ...values, relationship: event.target.value })
          }
        />
        <div className="sm:col-span-2">
          <Field
            id="invite-email"
            label="Their email"
            type="email"
            inputMode="email"
            autoComplete="off"
            maxLength={320}
            hint="Their own email, not yours. We send one link; you can resend in 10 minutes."
            value={values.email}
            error={errors.email}
            onChange={event =>
              setValues({ ...values, email: event.target.value })
            }
          />
        </div>
      </fieldset>
      <Notice tone={sent ? 'info' : 'error'}>{sent || message}</Notice>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
        <InkButton
          type="submit"
          disabled={pending}
          className="w-full sm:w-auto"
        >
          {pending ? 'Sending…' : submitLabel}
        </InkButton>
        {onCancel && (
          <TextButton disabled={pending} onClick={onCancel}>
            Cancel
          </TextButton>
        )}
      </div>
    </form>
  )
}
