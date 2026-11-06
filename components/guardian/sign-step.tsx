'use client'
import { useState } from 'react'
import type { OpenGuardianRequest } from '@/lib/guardian/schema'
import type { GuardianDetails, SignFormValues } from '@/lib/guardian/sign-form'
import { validateSignForm } from '@/lib/guardian/sign-form'
import { focusFirstError } from './focus'
import { GuardianHeading } from './guardian-shell'
import { RequestSummary } from './request-summary'
import { CheckRow, FactRow, Field, InkButton, Notice, TextButton } from './ui'
import { SignSection, WaiverSection } from './waiver-section'

export function SignStep({
  view,
  details,
  values,
  onValues,
  onSign,
  onEditDetails,
  onDecline,
  pending,
  message,
}: {
  view: OpenGuardianRequest
  details: GuardianDetails
  values: SignFormValues
  onValues: (values: SignFormValues) => void
  onSign: () => void
  onEditDetails: () => void
  onDecline: () => void
  pending: boolean
  message: string
}) {
  const [errors, setErrors] = useState<Record<string, string>>({})
  const set = (patch: Partial<SignFormValues>) => {
    onValues({ ...values, ...patch })
    if (Object.keys(errors).length) {
      const next = { ...errors }
      for (const key of Object.keys(patch)) {
        if (key === 'membershipAgreed') delete next['g-membership']
        if (key === 'waiverAgreed') delete next['g-agree']
        if (key === 'waiverRead') delete next['g-read']
        if (key === 'authority') delete next['g-authority']
        if (key === 'signatureName') delete next['g-signature']
      }
      setErrors(next)
    }
  }
  const count = Object.keys(errors).length
  return (
    <form
      noValidate
      className="space-y-10"
      onSubmit={event => {
        event.preventDefault()
        const next = validateSignForm(values, view, details.name)
        setErrors(next)
        if (Object.keys(next).length) {
          focusFirstError(event.currentTarget)
          return
        }
        onSign()
      }}
    >
      <GuardianHeading eyebrow="Step 3 of 3" title="Read and sign.">
        <p>
          Email confirmed. Review what you’re signing for {view.participantName}
          , then type your name at the bottom.
        </p>
      </GuardianHeading>
      <RequestSummary view={view} />
      <fieldset disabled={pending} className="min-w-0 space-y-10">
        <legend className="sr-only">Signing details</legend>
        <SignSection id="g-you-heading" title="You">
          <dl>
            <FactRow label="Name">{details.name}</FactRow>
            <FactRow label="Email">
              <span className="block">{view.verifiedEmail}</span>
              <span className="text-sm text-muted-foreground">
                Confirmed by code
              </span>
            </FactRow>
            <FactRow label="Phone">{details.phone}</FactRow>
            <FactRow label="Relationship">{details.relationship}</FactRow>
          </dl>
          <TextButton onClick={onEditDetails}>Change your details</TextButton>
        </SignSection>
        {view.membership && (
          <SignSection id="g-membership-heading" title="Membership permission">
            <div className="border border-border bg-card p-4 text-base leading-7 whitespace-pre-wrap [overflow-wrap:anywhere] sm:p-5">
              {view.membership.body.split('\n').slice(2).join('\n')}
            </div>
            <CheckRow
              id="g-membership"
              checked={values.membershipAgreed}
              onChange={value => set({ membershipAgreed: value })}
              error={errors['g-membership']}
            >
              I give {view.participantName} permission to be a club member
              (version {view.membership.version}).
            </CheckRow>
          </SignSection>
        )}
        {view.waiver && (
          <WaiverSection
            waiver={view.waiver}
            participantName={view.participantName}
            values={values}
            set={set}
            errors={errors}
          />
        )}
        <SignSection id="g-authority-heading" title="Your authority">
          <CheckRow
            id="g-authority"
            checked={values.authority}
            onChange={value => set({ authority: value })}
            error={errors['g-authority']}
          >
            I’m {view.participantName}’s parent or legal guardian, and I’m
            legally allowed to sign for them.
          </CheckRow>
          <div className="space-y-2 border-l border-border pl-5 sm:ml-3">
            <p className="text-sm text-muted-foreground">
              Also check this if it applies. An officer will follow up.
            </p>
            <CheckRow
              id="g-special"
              checked={values.special}
              onChange={value => set({ special: value })}
            >
              My authority is shared, limited, or set by a court order.
            </CheckRow>
          </div>
          {values.special && (
            <div className="space-y-2 pl-5 sm:ml-3">
              <label
                htmlFor="g-special-note"
                className="block text-sm font-medium"
              >
                Anything the club should know?
                <span className="font-normal text-muted-foreground">
                  {' '}
                  (optional)
                </span>
              </label>
              <textarea
                id="g-special-note"
                rows={3}
                maxLength={1000}
                value={values.specialNote}
                onChange={event => set({ specialNote: event.target.value })}
                className="block w-full border border-foreground/35 bg-transparent px-3 py-3 text-base focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-foreground"
              />
              <p className="text-sm text-muted-foreground">
                You don’t need to upload documents.
              </p>
            </div>
          )}
        </SignSection>
        <SignSection id="g-signature-heading" title="Sign">
          <Field
            id="g-signature"
            label="Type your full legal name"
            autoComplete="off"
            maxLength={200}
            hint={`Must match: ${details.name}`}
            value={values.signatureName}
            error={errors['g-signature']}
            onChange={event => set({ signatureName: event.target.value })}
            className="font-brand text-xl"
          />
          <p className="text-sm leading-6 text-muted-foreground">
            Typing your name signs electronically. We record the time, your
            confirmed email, and this device. You’ll get a copy by email.
          </p>
        </SignSection>
      </fieldset>
      <Notice tone="error">
        {count
          ? `${count} ${count === 1 ? 'thing needs' : 'things need'} attention above.`
          : message}
      </Notice>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
        <InkButton
          type="submit"
          disabled={pending}
          className="w-full sm:w-auto"
        >
          {pending
            ? 'Signing…'
            : `Sign for ${view.participantName.split(' ')[0]}`}
        </InkButton>
        <TextButton disabled={pending} onClick={onDecline}>
          I don’t want to sign
        </TextButton>
      </div>
    </form>
  )
}
