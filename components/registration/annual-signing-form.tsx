'use client'
import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'
import { TextField } from '@/components/forms/fields'
import { FormActions } from '@/components/forms/form-actions'
import {
  FormMessage,
  FormProgress,
  FormShell,
  FormStep,
} from '@/components/forms/form-shell'
import { FormViewport } from '@/components/forms/form-viewport'
import { Button } from '@/components/ui/button'
import { declareAgeAction } from '@/lib/registration/actions'
import {
  requestAnnualGuardianAction,
  signAnnualAction,
} from '@/lib/registration/annual-actions'
import type { AnnualState } from '@/lib/registration/annual-schema'
import { emptySignerDetails, WaiverFields } from './waiver-fields'
export function AnnualSigningForm({ state }: { state: AnnualState }) {
  const router = useRouter()
  const [age, setAge] = useState(state.ageAdult)
  const [read, setRead] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [name, setName] = useState('')
  const [details, setDetails] = useState(emptySignerDetails)
  const [contact, setContact] = useState(state.emergencyContact)
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState('')
  const request = useRef<string | null>(null)
  const busy = useRef(false)
  const waiver = state.current
  if (!waiver)
    return (
      <p>
        The current annual waiver is not yet published. Contact a club officer
        for the reviewed waiver and participation requirements.
      </p>
    )
  return (
    <FormShell
      onSubmit={async event => {
        event.preventDefault()
        if (busy.current) return
        busy.current = true
        setPending(true)
        try {
          if (age === null) {
            setMessage('Declare your age first.')
            return
          }
          if (age === false) {
            setMessage(
              'Ask an officer to verify your guardian’s signed annual waiver.',
            )
            return
          }
          if (!read || !agreed) {
            setMessage('Read the full document and agree before signing.')
            return
          }
          request.current ??= crypto.randomUUID()
          const result = await signAnnualAction(waiver.id, request.current, {
            waiverAgreed: agreed,
            waiverId: waiver.id,
            signatureName: name,
            signerDetails: details,
            emergencyContact: contact,
          })
          setMessage(result.message)
          if (result.ok) router.refresh()
          else request.current = null
        } catch {
          setMessage(
            'Signature could not be saved. Check every field and retry.',
          )
        } finally {
          busy.current = false
          setPending(false)
        }
      }}
    >
      <FormProgress index={0} count={1} />
      <FormMessage>{message}</FormMessage>
      <FormViewport stepId="annual-waiver" direction={1}>
        <FormStep title="Review & sign annual waiver">
          <fieldset disabled={pending} className="space-y-5">
            {age === null && (
              <label className="block">
                Age declaration
                <select
                  className="block w-full rounded border p-3"
                  defaultValue=""
                  onChange={async event => {
                    const adult = event.target.value === 'adult'
                    const result = await declareAgeAction(adult)
                    if (result.ok) setAge(adult)
                    else setMessage(result.message ?? 'Unable to save age.')
                  }}
                >
                  <option value="" disabled>
                    Choose your age group
                  </option>
                  <option value="adult">I am 18 or older</option>
                  <option value="minor">I am under 18</option>
                </select>
              </label>
            )}
            {(['name', 'relationship', 'phone', 'notes'] as const).map(
              field => (
                <TextField
                  key={field}
                  label={`Emergency contact ${field}`}
                  optional={field === 'notes'}
                  value={contact[field]}
                  onChange={event =>
                    setContact({ ...contact, [field]: event.target.value })
                  }
                />
              ),
            )}
            <WaiverFields
              snapshot={{
                waiverRequired: true,
                waiverSigned: false,
                annualWaiver: true,
                ageAdult: age,
                waiver: { ...waiver, sourceUrl: waiver.source_url },
                waiverCoverage: {
                  from: waiver.effective_from,
                  until: waiver.effective_until,
                  activities: waiver.activity_scope,
                },
              }}
              hasRead={read}
              onRead={() => setRead(true)}
              agreed={agreed}
              onAgree={setAgreed}
              signature={name}
              onSignature={setName}
              details={details}
              onDetails={setDetails}
            />
          </fieldset>
        </FormStep>
      </FormViewport>
      <a
        className="text-sm underline"
        href={`/api/waivers/${waiver.id}/document`}
      >
        Download this exact annual waiver for guardian completion
      </a>
      {age === false && (
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          onClick={async () => {
            setPending(true)
            try {
              const result = await requestAnnualGuardianAction(waiver.id)
              setMessage(result.message)
            } catch {
              setMessage('Unable to request review. Contact an officer.')
            } finally {
              setPending(false)
            }
          }}
        >
          Request guardian document review
        </Button>
      )}
      <FormActions
        pending={pending}
        disabled={age !== true}
        primaryLabel="Sign annual waiver"
      />
    </FormShell>
  )
}
