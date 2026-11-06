'use client'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import {
  sendGuardianCodeAction,
  verifyGuardianCodeAction,
  withdrawGuardianAction,
} from '@/lib/guardian/guardian-actions'
import type { OpenGuardianRequest } from '@/lib/guardian/schema'
import { GuardianHeading } from './guardian-shell'
import { RequestSummary } from './request-summary'
import {
  FactRow,
  GuardianTag,
  InkButton,
  LineButton,
  Notice,
  TextButton,
} from './ui'
import { VerifyStep } from './verify-step'

function decisionTag(signed: NonNullable<OpenGuardianRequest['signed']>) {
  if (signed.withdrawn) return <GuardianTag label="Withdrawn" tone="stopped" />
  if (signed.decision === 'approved')
    return <GuardianTag label="Accepted" tone="ready" />
  if (signed.decision === 'rejected')
    return <GuardianTag label="Not approved" tone="stopped" />
  if (signed.decision === 'clarification')
    return <GuardianTag label="Needs info" tone="action" />
  return <GuardianTag label="Club review" tone="review" />
}

/** A guardian's own signed record: copy and withdrawal, each behind a fresh email code. */
export function SignedRecord({
  token,
  view,
}: {
  token: string
  view: OpenGuardianRequest
}) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [mode, setMode] = useState<
    'view' | 'verify' | 'withdraw' | 'withdrawn'
  >('view')
  const [message, setMessage] = useState('')
  const [info, setInfo] = useState('')
  const [note, setNote] = useState('')
  const signed = view.signed
  const email = view.guardian?.email ?? ''
  const verified = Boolean(view.verifiedEmail)
  if (!signed) return null
  const first = view.participantName.split(' ')[0]
  const sendCode = () =>
    start(async () => {
      const result = await sendGuardianCodeAction(token, email)
      if (result.ok) {
        setMode('verify')
        setInfo(mode === 'verify' ? result.message : '')
        setMessage('')
      } else setMessage(result.message)
    })
  if (mode === 'verify')
    return (
      <VerifyStep
        email={email}
        purpose="open your signed record"
        pending={pending}
        message={message}
        info={info}
        onResend={sendCode}
        onChangeEmail={() => setMode('view')}
        onVerify={code =>
          start(async () => {
            const result = await verifyGuardianCodeAction(token, code)
            if (result.ok) {
              setMode('view')
              setMessage('')
              router.refresh()
            } else setMessage(result.message)
          })
        }
      />
    )
  if (mode === 'withdrawn' || signed.withdrawn)
    return (
      <div className="space-y-8">
        <GuardianHeading
          eyebrow="Guardian record"
          title="Permission withdrawn."
        >
          <p>
            It no longer covers {first}’s future activities, and the club has
            been told. The signed record is kept, as UNLV requires. Past
            activities aren’t affected.
          </p>
        </GuardianHeading>
        <RequestSummary view={view} validUntil={signed.validUntil} />
        <dl>
          <FactRow label="Status">
            <GuardianTag label="Withdrawn" tone="stopped" />
          </FactRow>
          <FactRow label="Withdrawn">
            {new Date(signed.withdrawnAt ?? Date.now()).toLocaleDateString(
              'en-US',
              {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
                timeZone: 'America/Los_Angeles',
              },
            )}
          </FactRow>
        </dl>
      </div>
    )
  return (
    <div className="space-y-8">
      <GuardianHeading
        eyebrow="Guardian record"
        title={`Your permission for ${first}.`}
      >
        <p>
          You signed this on{' '}
          {new Date(signed.at).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
            timeZone: 'America/Los_Angeles',
          })}
          .
        </p>
      </GuardianHeading>
      <RequestSummary view={view} validUntil={signed.validUntil} />
      <dl>
        <FactRow label="Status">{decisionTag(signed)}</FactRow>
        {signed.name && <FactRow label="Signed by">{signed.name}</FactRow>}
      </dl>
      {mode === 'withdraw' ? (
        <section
          aria-labelledby="g-withdraw-heading"
          className="space-y-5 border-t border-foreground/80 pt-5"
        >
          <h2
            id="g-withdraw-heading"
            className="font-brand text-2xl font-bold uppercase leading-none tracking-wide"
          >
            Withdraw permission?
          </h2>
          <p className="text-base leading-7">
            {first} won’t be covered for future club activities until a guardian
            signs again. Past activities and the signed record don’t change.
          </p>
          <div className="space-y-2">
            <label
              htmlFor="g-withdraw-note"
              className="block text-sm font-medium"
            >
              Note for the club
              <span className="font-normal text-muted-foreground">
                {' '}
                (optional)
              </span>
            </label>
            <textarea
              id="g-withdraw-note"
              rows={3}
              maxLength={1000}
              value={note}
              onChange={event => setNote(event.target.value)}
              className="block w-full border border-foreground/35 bg-transparent px-3 py-3 text-base focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-foreground"
            />
          </div>
          <Notice tone="error">{message}</Notice>
          <div className="flex flex-col gap-3 sm:flex-row">
            <LineButton
              disabled={pending}
              onClick={() =>
                start(async () => {
                  const result = await withdrawGuardianAction(token, note)
                  if (result.ok) setMode('withdrawn')
                  else setMessage(result.message)
                })
              }
            >
              {pending ? 'Withdrawing…' : 'Withdraw permission'}
            </LineButton>
            <InkButton disabled={pending} onClick={() => setMode('view')}>
              Keep permission
            </InkButton>
          </div>
        </section>
      ) : verified ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
          <a
            href={`/guardian/${token}/copy`}
            className="inline-flex min-h-12 w-full items-center justify-center bg-foreground px-5 font-brand text-base font-bold uppercase tracking-[0.06em] text-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground sm:w-auto"
          >
            Download your copy
          </a>
          <TextButton onClick={() => setMode('withdraw')}>
            Withdraw permission
          </TextButton>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-base leading-7">
            To download a copy or withdraw, we’ll email a code to{' '}
            <strong className="font-semibold [overflow-wrap:anywhere]">
              {email}
            </strong>
            .
          </p>
          <Notice tone="error">{message}</Notice>
          <InkButton
            disabled={pending}
            onClick={sendCode}
            className="w-full sm:w-auto"
          >
            {pending ? 'Sending…' : 'Email me a code'}
          </InkButton>
        </div>
      )}
    </div>
  )
}
