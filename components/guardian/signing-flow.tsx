'use client'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useTransition } from 'react'
import {
  declineGuardianAction,
  sendGuardianCodeAction,
  signGuardianAction,
  verifyGuardianCodeAction,
} from '@/lib/guardian/guardian-actions'
import type { OpenGuardianRequest } from '@/lib/guardian/schema'
import {
  type GuardianDetails,
  initialSignValues,
  type SignFormValues,
} from '@/lib/guardian/sign-form'
import { DetailsStep } from './details-step'
import { focusStepHeading } from './focus'
import { GuardianHeading } from './guardian-shell'
import { RequestSummary } from './request-summary'
import { SignStep } from './sign-step'
import { InkButton, LineButton, Notice } from './ui'
import { VerifyStep } from './verify-step'

type Step =
  | 'handoff'
  | 'details'
  | 'verify'
  | 'sign'
  | 'decline'
  | 'declined'
  | 'done'

const draftKey = (id: string) => `guardian-details:${id}`

function readDraft(id: string): GuardianDetails | null {
  try {
    const raw = window.sessionStorage.getItem(draftKey(id))
    return raw ? (JSON.parse(raw) as GuardianDetails) : null
  } catch {
    return null
  }
}

export function SigningFlow({
  token,
  view,
  initialStep,
  initialValidUntil,
}: {
  token: string
  view: OpenGuardianRequest
  /** Fixtures pass a step; real visits derive it from the request. */
  initialStep?: Step
  /** Fixture-only: the coverage end returned after signing. */
  initialValidUntil?: string
}) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [step, setStep] = useState<Step>(
    initialStep ??
      (view.verifiedEmail
        ? 'sign'
        : view.delivery === 'same_device'
          ? 'handoff'
          : 'details'),
  )
  const [details, setDetails] = useState<GuardianDetails>({
    name: view.guardian?.name ?? '',
    email: view.verifiedEmail ?? view.guardian?.email ?? '',
    phone: view.guardian?.phone ?? '',
    relationship: view.guardian?.relationship ?? '',
  })
  const [values, setValues] = useState<SignFormValues>(() =>
    initialSignValues(view, details),
  )
  const [message, setMessage] = useState('')
  const [info, setInfo] = useState('')
  const [declineReason, setDeclineReason] = useState('')
  const [approved, setApproved] = useState(false)
  const [validUntil, setValidUntil] = useState<string | null>(
    initialValidUntil ?? null,
  )

  // Keep only contact details across interruptions; nothing medical is stored on the device.
  useEffect(() => {
    const draft = readDraft(view.requestId)
    if (draft && !view.verifiedEmail)
      setDetails(current => ({
        name: draft.name?.trim() ? draft.name : current.name,
        email: draft.email?.trim() ? draft.email : current.email,
        phone: draft.phone?.trim() ? draft.phone : current.phone,
        relationship: draft.relationship?.trim()
          ? draft.relationship
          : current.relationship,
      }))
  }, [view.requestId, view.verifiedEmail])
  useEffect(() => {
    try {
      window.sessionStorage.setItem(
        draftKey(view.requestId),
        JSON.stringify(details),
      )
    } catch {
      // Storage can be unavailable in private browsing; the form still works.
    }
  }, [details, view.requestId])
  // A refreshed view (after verification) brings the participant prefill.
  // biome-ignore lint/correctness/useExhaustiveDependencies: apply once, when the verified view arrives.
  useEffect(() => {
    if (view.prefill)
      setValues(current => ({
        ...initialSignValues(view, details),
        ...pick(current),
      }))
  }, [view.prefill])

  const go = (next: Step) => {
    setMessage('')
    setInfo('')
    setStep(next)
    focusStepHeading()
  }
  const sendCode = () =>
    start(async () => {
      const result = await sendGuardianCodeAction(token, details.email)
      if (result.ok) {
        setDetails(current => ({
          ...current,
          email: result.email ?? current.email,
        }))
        if (step !== 'verify') go('verify')
        else {
          setMessage('')
          setInfo(result.message)
        }
      } else setMessage(result.message)
    })

  if (step === 'handoff')
    return (
      <div className="space-y-8">
        <GuardianHeading
          eyebrow="Hand this phone over"
          title="Parent or guardian, this part’s for you."
        >
          <p>
            {view.participantName} is under 18, so a parent or legal guardian
            signs for them. It takes about 5 minutes. No account needed.
          </p>
          <p className="text-muted-foreground">
            {view.participantName.split(' ')[0]}: pass the phone over. You’ll
            get it back at the end.
          </p>
        </GuardianHeading>
        <RequestSummary view={view} />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
          <InkButton className="w-full sm:w-auto" onClick={() => go('details')}>
            I’m the parent or guardian
          </InkButton>
          <a
            className="inline-flex min-h-11 items-center justify-center underline underline-offset-4 sm:justify-start"
            href={backHref(view)}
          >
            Not with you? Email them a link instead
          </a>
        </div>
      </div>
    )
  if (step === 'details')
    return (
      <DetailsStep
        participantName={view.participantName}
        details={details}
        onChange={setDetails}
        onSubmit={sendCode}
        pending={pending}
        message={message}
        returning={Boolean(view.guardian?.emailVerified)}
      />
    )
  if (step === 'verify')
    return (
      <VerifyStep
        email={details.email}
        stepLabel="Step 2 of 3"
        purpose={`continue to the documents for ${view.participantName.split(' ')[0]}`}
        pending={pending}
        message={message}
        info={info}
        onResend={sendCode}
        onChangeEmail={() => go('details')}
        onVerify={code =>
          start(async () => {
            const result = await verifyGuardianCodeAction(token, code)
            if (result.ok) {
              go('sign')
              router.refresh()
            } else setMessage(result.message)
          })
        }
      />
    )
  if (step === 'sign')
    return (
      <SignStep
        view={view}
        details={details}
        values={values}
        onValues={setValues}
        pending={pending}
        message={message}
        onEditDetails={() => go('details')}
        onDecline={() => go('decline')}
        onSign={() =>
          start(async () => {
            const result = await signGuardianAction(token, {
              guardian: {
                name: details.name,
                relationship: details.relationship,
                phone: details.phone,
                authority: values.authority,
                special: values.special,
                specialNote: values.specialNote,
              },
              waiver: view.waiver
                ? {
                    waiverId: view.waiver.id,
                    agreed: values.waiverAgreed,
                    participant: {
                      birthDate: values.birthDate,
                      address: values.address,
                    },
                    emergencyContact: values.emergency,
                    initials: values.initials,
                  }
                : null,
              membershipAgreed: values.membershipAgreed,
              signatureName: values.signatureName,
            })
            if (result.ok) {
              try {
                window.sessionStorage.removeItem(draftKey(view.requestId))
              } catch {
                // Nothing to clear when storage is unavailable.
              }
              setApproved(Boolean(result.approved))
              setValidUntil(result.validUntil ?? null)
              go('done')
            } else setMessage(result.message)
          })
        }
      />
    )
  if (step === 'decline')
    return (
      <div className="space-y-8">
        <GuardianHeading title="Not signing?">
          <p>
            That’s okay. Nothing gets signed, and we’ll let{' '}
            {view.participantName.split(' ')[0]} know. They can send a new
            request later.
          </p>
        </GuardianHeading>
        <div className="space-y-2">
          <label htmlFor="g-decline" className="block text-sm font-medium">
            Want to tell them why?
            <span className="font-normal text-muted-foreground">
              {' '}
              (optional, not shared with the club)
            </span>
          </label>
          <textarea
            id="g-decline"
            rows={3}
            maxLength={1000}
            value={declineReason}
            onChange={event => setDeclineReason(event.target.value)}
            className="block w-full border border-foreground/35 bg-transparent px-3 py-3 text-base focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-foreground"
          />
        </div>
        <Notice tone="error">{message}</Notice>
        <div className="flex flex-col gap-3 sm:flex-row">
          <LineButton
            disabled={pending}
            onClick={() =>
              start(async () => {
                const result = await declineGuardianAction(token, declineReason)
                if (result.ok) go('declined')
                else setMessage(result.message)
              })
            }
          >
            {pending ? 'Saving…' : 'Don’t sign'}
          </LineButton>
          <InkButton
            disabled={pending}
            onClick={() => go(view.verifiedEmail ? 'sign' : 'details')}
          >
            Go back
          </InkButton>
        </div>
      </div>
    )
  if (step === 'declined')
    return (
      <GuardianHeading title="Nothing was signed.">
        <p>
          We’ve let {view.participantName.split(' ')[0]} know. You can close
          this page.
        </p>
      </GuardianHeading>
    )
  return (
    <DoneView
      view={view}
      details={details}
      approved={approved}
      validUntil={validUntil}
    />
  )
}

function pick(values: SignFormValues): Partial<SignFormValues> {
  const {
    membershipAgreed,
    waiverRead,
    waiverAgreed,
    initials,
    authority,
    special,
    specialNote,
    signatureName,
  } = values
  return {
    membershipAgreed,
    waiverRead,
    waiverAgreed,
    initials,
    authority,
    special,
    specialNote,
    signatureName,
  }
}

function backHref(view: OpenGuardianRequest) {
  return view.trip ? `/trips/${view.trip.id}/rsvp` : '/profile/events/guardian'
}

function DoneView({
  view,
  details,
  approved,
  validUntil,
}: {
  view: OpenGuardianRequest
  details: GuardianDetails
  approved: boolean
  validUntil: string | null
}) {
  const first = view.participantName.split(' ')[0]
  const finish = view.trip
    ? `${first} still needs to finish registering for ${view.trip.title}.`
    : `${first} still registers for each trip.`
  return (
    <div className="space-y-8">
      <GuardianHeading
        eyebrow="Signed"
        title={`Thanks, ${details.name.split(' ')[0]}. It’s signed.`}
      >
        <p>
          We emailed a copy to{' '}
          <strong className="font-semibold [overflow-wrap:anywhere]">
            {view.verifiedEmail ?? details.email}
          </strong>
          . Use the link in that email anytime to download it or withdraw
          permission.
        </p>
        <p>
          {approved
            ? `The club already verified you, so you’re done. ${finish}`
            : `A club officer reviews new guardian signatures, usually within a few days. ${first} can finish registering once it’s approved.`}
        </p>
      </GuardianHeading>
      <RequestSummary view={view} validUntil={validUntil} />
      {view.delivery === 'same_device' ? (
        <div className="space-y-3 border-t border-foreground/80 pt-5">
          <p className="font-brand text-2xl font-bold uppercase leading-none tracking-wide">
            Hand the phone back to {first}.
          </p>
          <a
            href={backHref(view)}
            className="inline-flex min-h-12 w-full items-center justify-center bg-foreground px-5 font-brand text-base font-bold uppercase tracking-[0.06em] text-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground sm:w-auto"
          >
            {view.trip
              ? `Back to ${view.trip.title}`
              : 'Back to guardian permission'}
          </a>
        </div>
      ) : (
        <p className="text-base leading-7 text-muted-foreground">
          You’re all done. You can close this tab.
        </p>
      )}
    </div>
  )
}
