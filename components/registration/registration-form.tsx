'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { declareAgeAction } from '@/lib/registration/actions'
import type { TripRegistrationSnapshot } from '@/lib/registration/schema'
import { useRegistrationCommand } from '@/lib/registration/use-registration-command'
import { EmergencyFields, QuestionFields } from './question-fields'
import { RegistrationEvents, RegistrationSummary } from './registration-summary'
import { emptySignerDetails, WaiverFields } from './waiver-fields'

export function RegistrationForm({
  snapshot,
}: {
  snapshot: TripRegistrationSnapshot
}) {
  const router = useRouter()
  const { run, pending, message } = useRegistrationCommand(snapshot.tripId)
  const [agePending, startAge] = useTransition()
  const [ageMessage, setAgeMessage] = useState('')
  const [answers, setAnswers] = useState(snapshot.answers)
  const [contact, setContact] = useState(snapshot.emergencyContact)
  const [agreed, setAgreed] = useState(false)
  const [signature, setSignature] = useState('')
  const [signerDetails, setSignerDetails] = useState(emptySignerDetails)
  const [contactConfirmed, setContactConfirmed] = useState(false)
  const canRegister = snapshot.actions.includes('register')
  const canUpdate = snapshot.actions.includes('update_response')
  useEffect(() => {
    if (!snapshot.offer) return
    const refresh = () => router.refresh()
    const timer = setTimeout(
      refresh,
      Math.max(
        1000,
        new Date(snapshot.offer.expiresAt).getTime() - Date.now() + 250,
      ),
    )
    window.addEventListener('focus', refresh)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('focus', refresh)
    }
  }, [snapshot.offer, router])
  function declareAge(adult: boolean) {
    startAge(async () => {
      try {
        const result = await declareAgeAction(adult)
        setAgeMessage(
          result.ok
            ? 'Age declaration saved.'
            : (result.message ?? 'Please try again.'),
        )
        router.refresh()
      } catch {
        setAgeMessage('Age declaration could not be saved. Please try again.')
      }
    })
  }
  return (
    <div className="space-y-6">
      <RegistrationSummary snapshot={snapshot} />
      {snapshot.ageAdult === null ? (
        <section className="space-y-3">
          <h2 className="font-medium">Age declaration</h2>
          <p className="text-sm">
            Participants under 18 need officer-confirmed guardian consent.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button disabled={agePending} onClick={() => declareAge(true)}>
              I am 18 or older
            </Button>
            <Button
              variant="outline"
              disabled={agePending}
              onClick={() => declareAge(false)}
            >
              I am under 18
            </Button>
          </div>
          <output>{ageMessage}</output>
        </section>
      ) : null}
      {snapshot.eligibilityReasons.length ? (
        <div className="space-y-2 rounded-lg bg-muted p-4">
          {snapshot.eligibilityReasons.map(reason => (
            <p key={reason}>{reason}</p>
          ))}
          {snapshot.eligibility === 'members' ? (
            <Link href="/membership" className="underline">
              Review membership
            </Link>
          ) : null}
          {snapshot.ageAdult === false ? (
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() =>
                run({
                  command: 'request_guardian',
                  expectedRevision: snapshot.revision,
                  data: {},
                })
              }
            >
              Request guardian review
            </Button>
          ) : null}
        </div>
      ) : null}
      {canRegister || canUpdate ? (
        <form
          className="space-y-5"
          onSubmit={event => {
            event.preventDefault()
            run({
              command: canRegister ? 'register' : 'update_response',
              expectedRevision: snapshot.revision,
              data: {
                formVersion: snapshot.formVersion,
                answers,
                emergencyContact: contact,
                emergencyConfirmed: contactConfirmed,
                ...(agreed &&
                !snapshot.waiverSigned &&
                snapshot.ageAdult === true
                  ? {
                      waiverAgreed: true,
                      waiverId: snapshot.waiver?.id,
                      signatureName: signature,
                      ...(snapshot.waiver?.sourceUrl ? { signerDetails } : {}),
                    }
                  : {}),
              },
            })
          }}
        >
          <QuestionFields
            questions={snapshot.questions}
            answers={answers}
            onChange={setAnswers}
          />
          <EmergencyFields
            value={contact}
            onChange={value => {
              setContact(value)
              setContactConfirmed(false)
            }}
            required={snapshot.emergencyRequired}
          />
          {snapshot.emergencyRequired ? (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                required
                checked={contactConfirmed}
                onChange={event => setContactConfirmed(event.target.checked)}
              />
              I confirm this emergency contact is current for this trip.
            </label>
          ) : null}
          <WaiverFields
            snapshot={snapshot}
            agreed={agreed}
            onAgree={setAgreed}
            signature={signature}
            onSignature={setSignature}
            details={signerDetails}
            onDetails={setSignerDetails}
          />
          <Button
            disabled={
              pending ||
              agePending ||
              (canRegister && snapshot.eligibilityReasons.length > 0)
            }
            type="submit"
          >
            {pending
              ? 'Saving…'
              : canRegister
                ? snapshot.availability === 'waitlist'
                  ? 'Join waitlist'
                  : 'Register for trip'
                : 'Save registration details'}
          </Button>
        </form>
      ) : null}
      <div className="flex flex-wrap gap-2">
        {snapshot.actions.includes('accept_offer') ? (
          <Button
            disabled={pending}
            onClick={() =>
              run({
                command: 'accept_offer',
                expectedRevision: snapshot.revision,
                data: { offerId: snapshot.offer?.id },
              })
            }
          >
            Accept seat offer
          </Button>
        ) : null}
        {snapshot.actions.includes('decline_offer') ? (
          <Button
            variant="outline"
            disabled={pending}
            onClick={() =>
              run({
                command: 'decline_offer',
                expectedRevision: snapshot.revision,
                data: { offerId: snapshot.offer?.id },
              })
            }
          >
            Decline offer
          </Button>
        ) : null}
        {snapshot.actions.includes('cancel') ? (
          <Button
            variant="outline"
            disabled={pending}
            onClick={() => {
              if (
                window.confirm(
                  'Cancel your registration and release any reserved seat?',
                )
              )
                run({
                  command: 'cancel',
                  expectedRevision: snapshot.revision,
                  data: {},
                })
            }}
          >
            Cancel registration
          </Button>
        ) : null}
      </div>
      <output aria-live="polite">{message}</output>
      {snapshot.requirements.length && canUpdate ? (
        <p className="text-sm">
          Before attendance: {snapshot.requirements.join(' ')}
        </p>
      ) : null}
      <RegistrationEvents snapshot={snapshot} />
    </div>
  )
}
