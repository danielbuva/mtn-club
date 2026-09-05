'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState, useTransition } from 'react'
import { FormMessage } from '@/components/forms/form-shell'
import { Button } from '@/components/ui/button'
import {
  declareAgeAction,
  loadRsvpChoicesAction,
} from '@/lib/registration/actions'
import type { TripRegistrationSnapshot } from '@/lib/registration/schema'
import { useRegistrationCommand } from '@/lib/registration/use-registration-command'
import { RegistrationExit } from './registration-exit'
import { RegistrationFlow } from './registration-flow'
import { SignupIntent } from './signup-intent'

export function RegistrationForm({
  snapshot,
}: {
  snapshot: TripRegistrationSnapshot
}) {
  const router = useRouter()
  const { run, pending, message } = useRegistrationCommand(snapshot.tripId)
  const [agePending, startAge] = useTransition()
  const [ageMessage, setAgeMessage] = useState('')
  const canRegister = snapshot.actions.includes('register')
  const canUpdate = snapshot.actions.includes('update_response')
  const hadEditableForm = useRef(false)
  if (canRegister || canUpdate) hadEditableForm.current = true
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
  async function cancelRegistration() {
    const result = await run({
      command: 'cancel',
      expectedRevision: snapshot.revision,
      data: {},
    })
    if (!result.ok) throw new Error(result.message)
    router.push('/trips')
  }
  const showForm = canRegister || canUpdate || hadEditableForm.current
  if (canRegister && snapshot.state !== 'incomplete') {
    return (
      <div
        data-registration-state={snapshot.state}
        className="relative space-y-6"
      >
        <h1 className="pr-14 font-brand text-3xl">{snapshot.title}</h1>
        <SignupIntent snapshot={snapshot} />
      </div>
    )
  }
  const reviewNotice = (
    <>
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
    </>
  )
  return (
    <div
      data-registration-state={snapshot.state}
      className="relative space-y-6"
    >
      {!showForm && (
        <h1 className="pr-14 font-brand text-3xl">{snapshot.title}</h1>
      )}
      {!showForm && (
        <FormMessage>{snapshot.state.replaceAll('_', ' ')}</FormMessage>
      )}
      {snapshot.ageAdult === null && !showForm ? (
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
      {!showForm && reviewNotice}
      {!showForm && snapshot.actions.includes('cancel') && (
        <RegistrationExit onCancel={cancelRegistration} disabled={pending} />
      )}
      {showForm ? (
        <RegistrationFlow
          snapshot={snapshot}
          onCancel={
            snapshot.actions.includes('cancel') ? cancelRegistration : undefined
          }
          reviewNotice={reviewNotice}
          onDeclareAge={async adult => {
            const result = await declareAgeAction(adult)
            if (!result.ok) throw new Error(result.message)
            const current = await loadRsvpChoicesAction(snapshot.tripId)
            router.refresh()
            return current
          }}
          onPersist={(data, intent, current) =>
            run({
              command:
                intent === 'draft'
                  ? 'save_draft'
                  : current.actions.includes('update_response')
                    ? 'update_response'
                    : 'register',
              expectedRevision: current.revision,
              data,
            })
          }
          onSavedDraft={() => router.push('/trips')}
        />
      ) : null}
      {message && <output aria-live="polite">{message}</output>}
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
      </div>
    </div>
  )
}
