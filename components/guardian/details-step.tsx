'use client'
import { useState } from 'react'
import type { GuardianDetails } from '@/lib/guardian/sign-form'
import { validateDetails } from '@/lib/guardian/sign-form'
import { focusFirstError } from './focus'
import { GuardianHeading } from './guardian-shell'
import { Field, InkButton, Notice } from './ui'

const relationships = [
  'Mother',
  'Father',
  'Parent',
  'Legal guardian',
  'Stepparent',
  'Grandparent',
]

export function DetailsStep({
  participantName,
  details,
  onChange,
  onSubmit,
  pending,
  message,
  returning,
}: {
  participantName: string
  details: GuardianDetails
  onChange: (details: GuardianDetails) => void
  onSubmit: () => void
  pending: boolean
  message: string
  returning: boolean
}) {
  const [errors, setErrors] = useState<
    Partial<Record<keyof GuardianDetails, string>>
  >({})
  const set = (key: keyof GuardianDetails) => (value: string) =>
    onChange({ ...details, [key]: value })
  return (
    <form
      noValidate
      className="space-y-8"
      onSubmit={event => {
        event.preventDefault()
        const next = validateDetails(details)
        setErrors(next)
        if (Object.keys(next).length) {
          focusFirstError(event.currentTarget)
          return
        }
        onSubmit()
      }}
    >
      <GuardianHeading
        eyebrow="Step 1 of 3"
        title={returning ? 'Welcome back.' : 'First, about you.'}
      >
        <p>
          {returning
            ? 'We kept your details from last time. Check they’re still right, and we’ll email you a code.'
            : `Tell us who’s signing for ${participantName}. We’ll email you a 6-digit code to confirm your address.`}
        </p>
      </GuardianHeading>
      <fieldset disabled={pending} className="space-y-5">
        <legend className="sr-only">Your details</legend>
        <Field
          id="g-name"
          label="Your full legal name"
          autoComplete="name"
          value={details.name}
          error={errors.name}
          maxLength={200}
          onChange={event => set('name')(event.target.value)}
        />
        <Field
          id="g-email"
          label="Your email"
          type="email"
          inputMode="email"
          autoComplete="email"
          hint={`Use your own email, not ${participantName}’s.`}
          value={details.email}
          error={errors.email}
          maxLength={320}
          onChange={event => set('email')(event.target.value)}
        />
        <Field
          id="g-phone"
          label="Your phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          hint="So trip leaders can reach you."
          value={details.phone}
          error={errors.phone}
          maxLength={50}
          onChange={event => set('phone')(event.target.value)}
        />
        <Field
          id="g-relationship"
          label={`Your relationship to ${participantName}`}
          list="g-relationships"
          autoComplete="off"
          value={details.relationship}
          error={errors.relationship}
          maxLength={80}
          onChange={event => set('relationship')(event.target.value)}
        />
        <datalist id="g-relationships">
          {relationships.map(option => (
            <option key={option} value={option} />
          ))}
        </datalist>
      </fieldset>
      <Notice tone="error">{message}</Notice>
      <InkButton type="submit" disabled={pending} className="w-full sm:w-auto">
        {pending ? 'Sending code…' : 'Email me a code'}
      </InkButton>
    </form>
  )
}
