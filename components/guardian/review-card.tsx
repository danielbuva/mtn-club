'use client'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { waiverDate } from '@/lib/guardian/presentation'
import { reviewGuardianAction } from '@/lib/guardian/review-actions'
import type { ReviewRequest } from '@/lib/guardian/schema'
import { focusFirstError } from './focus'
import {
  CheckRow,
  FactRow,
  FieldError,
  GuardianTag,
  InkButton,
  Notice,
} from './ui'

const when = (iso: string) =>
  new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'America/Los_Angeles',
  })

const decisionLabel: Record<string, string> = {
  approved: 'Approved',
  rejected: 'Rejected',
  clarification: 'Asked for info',
}
const shortDay = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'America/Los_Angeles',
  })

function device(userAgent: string | undefined) {
  if (!userAgent) return 'Not recorded'
  const os = /iPhone|iPad/.test(userAgent)
    ? 'iOS'
    : /Android/.test(userAgent)
      ? 'Android'
      : /Mac OS/.test(userAgent)
        ? 'macOS'
        : /Windows/.test(userAgent)
          ? 'Windows'
          : 'Other'
  const browser = /CriOS|Chrome/.test(userAgent)
    ? 'Chrome'
    : /Firefox|FxiOS/.test(userAgent)
      ? 'Firefox'
      : /Safari/.test(userAgent)
        ? 'Safari'
        : 'Browser'
  return `${browser} on ${os}`
}

const decisions = [
  {
    value: 'approved',
    label: 'Approve',
    hint: 'Counts for covered trips right away.',
  },
  {
    value: 'clarification',
    label: 'Ask for more info',
    hint: 'Stays in this queue. The participant sees your note.',
  },
  {
    value: 'rejected',
    label: 'Reject',
    hint: 'Doesn’t count. The participant sees your reason.',
  },
] as const

export function ReviewCard({ request }: { request: ReviewRequest }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [decision, setDecision] = useState<
    (typeof decisions)[number]['value'] | ''
  >('')
  const [reason, setReason] = useState('')
  const [checked, setChecked] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [message, setMessage] = useState('')
  const [done, setDone] = useState(false)
  const id = request.id.slice(0, 8)
  const e = request.evidence
  const docs = [
    request.membership
      ? `Membership permission v${request.membership.version}`
      : null,
    request.waiver
      ? `${request.waiver.title} v${request.waiver.version}`
      : null,
  ].filter(Boolean)
  return (
    <article
      aria-labelledby={`review-${id}`}
      className="space-y-5 border-t-2 border-foreground pt-6"
    >
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h3
            id={`review-${id}`}
            className="font-brand text-2xl font-bold uppercase leading-none tracking-wide"
          >
            {request.participantName}
          </h3>
          <p className="text-sm text-muted-foreground">
            Signed {when(request.signedAt)}
          </p>
        </div>
        <GuardianTag
          label={
            request.decision === 'clarification'
              ? 'Waiting on info'
              : 'Needs review'
          }
          tone={request.decision === 'clarification' ? 'waiting' : 'action'}
        />
      </header>
      {(request.specialArrangement ||
        request.guardian.guardianChanged ||
        request.decision === 'clarification') && (
        <ul className="space-y-2 border-l-2 border-[#d40000] pl-3 text-base leading-6 dark:border-[#ff8a80]">
          {request.guardian.guardianChanged && (
            <li>New guardian. A different guardian was verified before.</li>
          )}
          {request.specialArrangement && (
            <li>
              Shared, limited, or court-ordered authority.
              {e.specialNote ? (
                <span className="block text-muted-foreground">
                  “{e.specialNote}”
                </span>
              ) : null}
            </li>
          )}
          {request.decision === 'clarification' && request.decisionReason && (
            <li>You asked: “{request.decisionReason}”</li>
          )}
        </ul>
      )}
      <dl className="border-y border-border">
        <FactRow label="Guardian">
          {request.guardian.name} · {request.guardian.relationship}
        </FactRow>
        <FactRow label="Email">
          <span className="block">{request.guardian.email}</span>
          <span className="text-sm text-muted-foreground">
            Code confirmed {e.emailVerifiedAt ? when(e.emailVerifiedAt) : ''}.
            Shows inbox access, not identity.
          </span>
        </FactRow>
        <FactRow label="Phone">{request.guardian.phone ?? 'Not given'}</FactRow>
        <FactRow label="Authority">
          {!e.authorityDeclared
            ? 'Not declared'
            : request.specialArrangement
              ? 'Declared guardian · shared, limited, or court order (see note)'
              : 'Declared parent or legal guardian'}
        </FactRow>
        <FactRow label="Signed">{docs.join(' + ')}</FactRow>
        {request.waiver && (
          <FactRow label="Covers">
            {request.waiver.activities.join(', ')} ·{' '}
            {waiverDate(request.waiver.validFrom)} –{' '}
            {waiverDate(request.waiver.validUntil)}
          </FactRow>
        )}
        {request.waiver?.participantBirthDate && (
          <FactRow label="Birth date">
            {waiverDate(request.waiver.participantBirthDate)}
          </FactRow>
        )}
        <FactRow label="Device">
          {e.delivery === 'same_device'
            ? 'Participant’s device'
            : 'Guardian’s own link'}{' '}
          · {device(e.userAgent)}
        </FactRow>
        <FactRow label="Past reviews">
          {request.priorReviews.length
            ? request.priorReviews.map(r => (
                <span key={r.at} className="block">
                  {decisionLabel[r.decision] ?? r.decision}
                  {r.identityChecked ? ' · identity checked' : ''}
                  {r.basis === 'prior_verification' ? ' · automatic' : ''} ·{' '}
                  {shortDay(r.at)}
                  {r.guardianName ? ` (${r.guardianName})` : ''}
                </span>
              ))
            : 'None'}
        </FactRow>
        <FactRow label="Trips">
          {request.blockers.length
            ? request.blockers.map(t => t.title).join(', ')
            : 'No upcoming registrations'}
        </FactRow>
      </dl>
      {request.waiver && (
        <details className="group">
          <summary className="inline-flex min-h-11 cursor-pointer items-center underline underline-offset-4">
            Read the signed waiver text
          </summary>
          <p className="mt-3 max-h-80 overflow-y-auto border border-border p-4 text-sm leading-6 whitespace-pre-wrap [overflow-wrap:anywhere]">
            {request.waiver.body}
          </p>
        </details>
      )}
      {done ? (
        <Notice tone="info">{message}</Notice>
      ) : (
        <form
          noValidate
          className="space-y-5"
          onSubmit={event => {
            event.preventDefault()
            const form = event.currentTarget
            const next: Record<string, string> = {}
            if (!decision) next[`decision-${id}`] = 'Choose a decision.'
            if (decision && decision !== 'approved' && reason.trim().length < 5)
              next[`reason-${id}`] =
                'Add a short note the participant will see.'
            setErrors(next)
            if (Object.keys(next).length) return focusFirstError(form)
            start(async () => {
              const result = await reviewGuardianAction(
                request.id,
                decision,
                reason,
                decision === 'approved' && checked,
              )
              setMessage(result.message)
              if (result.ok) {
                setDone(true)
                router.refresh()
              }
            })
          }}
        >
          <fieldset disabled={pending} className="space-y-2">
            <legend className="mb-2 text-sm font-medium">Decision</legend>
            <div className="grid gap-2 sm:grid-cols-3">
              {decisions.map((option, index) => (
                <label
                  key={option.value}
                  className="flex min-h-12 cursor-pointer items-start gap-3 border border-foreground/35 p-3 has-[:checked]:border-foreground has-[:checked]:bg-foreground/5 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-foreground"
                >
                  <input
                    type="radio"
                    name={`decision-${id}`}
                    id={index === 0 ? `decision-${id}` : undefined}
                    value={option.value}
                    checked={decision === option.value}
                    aria-invalid={
                      index === 0
                        ? Boolean(errors[`decision-${id}`])
                        : undefined
                    }
                    onChange={() => setDecision(option.value)}
                    className="mt-1 size-4 accent-[var(--editorial-ink)]"
                  />
                  <span>
                    <span className="block font-medium">{option.label}</span>
                    <span className="block text-sm leading-5 text-muted-foreground">
                      {option.hint}
                    </span>
                  </span>
                </label>
              ))}
            </div>
            <FieldError id={`decision-${id}-error`}>
              {errors[`decision-${id}`]}
            </FieldError>
          </fieldset>
          {decision === 'approved' && (
            <CheckRow
              id={`identity-${id}`}
              checked={checked}
              onChange={setChecked}
            >
              I also checked this guardian’s identity and authority myself
              (call, meeting, or documents seen). Their future signatures for{' '}
              {request.participantName.split(' ')[0]} won’t need review.
            </CheckRow>
          )}
          {decision && decision !== 'approved' && (
            <div className="space-y-2">
              <label
                htmlFor={`reason-${id}`}
                className="block text-sm font-medium"
              >
                Note for the participant
              </label>
              <textarea
                id={`reason-${id}`}
                rows={3}
                maxLength={2000}
                value={reason}
                aria-invalid={Boolean(errors[`reason-${id}`])}
                aria-describedby={
                  errors[`reason-${id}`] ? `reason-${id}-error` : undefined
                }
                onChange={event => setReason(event.target.value)}
                className="block w-full border border-foreground/35 bg-transparent px-3 py-3 text-base focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-foreground"
              />
              <FieldError id={`reason-${id}-error`}>
                {errors[`reason-${id}`]}
              </FieldError>
            </div>
          )}
          <Notice tone="error">{message}</Notice>
          <InkButton type="submit" disabled={pending}>
            {pending ? 'Saving…' : 'Save decision'}
          </InkButton>
        </form>
      )}
    </article>
  )
}
