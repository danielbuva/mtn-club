'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { verifyAnnualGuardianAction } from '@/lib/registration/annual-actions'
import { useRegistrationCommand } from '@/lib/registration/use-registration-command'

export type GuardianRequest = {
  tripId?: string
  title: string
  userId: string
  name: string
  revision: number
  waiverId?: string | null
  waiverTitle: string | null
  waiverVersion: number | null
  waiverBody: string | null
}

export function GuardianReview({
  request,
  annual = false,
}: {
  request: GuardianRequest
  annual?: boolean
}) {
  const router = useRouter()
  const [annualPending, setAnnualPending] = useState(false)
  const [annualMessage, setAnnualMessage] = useState('')
  const [evidence, setEvidence] = useState('')
  const [guardianName, setGuardianName] = useState('')
  const [signedOn, setSignedOn] = useState('')
  const [reference, setReference] = useState('')
  const { run, pending, message } = useRegistrationCommand(request.tripId ?? '')
  return (
    <article className="space-y-3 rounded-lg border p-4">
      <h2 className="font-semibold">
        {request.name} · {request.title}
      </h2>
      {request.waiverBody ? (
        <details>
          <summary className="cursor-pointer underline">
            {request.waiverTitle}, version {request.waiverVersion}
          </summary>
          <p className="mt-3 whitespace-pre-wrap text-sm">
            {request.waiverBody}
          </p>
        </details>
      ) : (
        <p className="text-sm">
          Guardian consent for this trip; no trip waiver required.
        </p>
      )}
      <form
        className="space-y-3"
        onSubmit={async event => {
          event.preventDefault()
          if (annual && request.waiverId) {
            setAnnualPending(true)
            try {
              const result = await verifyAnnualGuardianAction(
                request.waiverId,
                request.userId,
                {
                  evidence,
                  guardianDocument: {
                    guardianName,
                    signedOn,
                    reference,
                    verified: true,
                  },
                },
              )
              setAnnualMessage(result.message)
              if (result.ok) router.refresh()
            } catch {
              setAnnualMessage('Unable to verify. Review the fields and retry.')
            } finally {
              setAnnualPending(false)
            }
            return
          }
          run({
            command: 'guardian_review',
            expectedRevision: request.revision,
            userId: request.userId,
            data: {
              evidence,
              waiverId: request.waiverId,
              ...(request.waiverBody
                ? {
                    guardianDocument: {
                      guardianName,
                      signedOn,
                      reference,
                      verified: true,
                    },
                  }
                : {}),
            },
          })
        }}
      >
        {request.waiverBody ? (
          <fieldset className="space-y-3">
            <legend className="font-medium">Parent-signed document</legend>
            <label
              className="block"
              htmlFor={`guardian-name-${request.tripId}-${request.userId}`}
            >
              Parent or legal guardian’s full name
              <Input
                id={`guardian-name-${request.tripId}-${request.userId}`}
                required
                minLength={2}
                maxLength={200}
                value={guardianName}
                onChange={e => setGuardianName(e.target.value)}
              />
            </label>
            <label
              className="block"
              htmlFor={`guardian-date-${request.tripId}-${request.userId}`}
            >
              Date signed by the parent or guardian
              <Input
                id={`guardian-date-${request.tripId}-${request.userId}`}
                required
                type="date"
                value={signedOn}
                onChange={e => setSignedOn(e.target.value)}
              />
            </label>
            <label
              className="block"
              htmlFor={`guardian-reference-${request.tripId}-${request.userId}`}
            >
              Retained document reference (restricted club storage)
              <Input
                id={`guardian-reference-${request.tripId}-${request.userId}`}
                required
                minLength={5}
                maxLength={1000}
                value={reference}
                onChange={e => setReference(e.target.value)}
              />
            </label>
            <label className="flex items-start gap-2">
              <input type="checkbox" required />I verified the signer’s identity
              and authority, their signature on this exact waiver version, and
              the completed participant and emergency contact fields. The signed
              document is retained in restricted club storage.
            </label>
          </fieldset>
        ) : null}
        <Label htmlFor={`consent-${request.tripId}-${request.userId}`}>
          Verified consent evidence or reference
        </Label>
        <Input
          id={`consent-${request.tripId}-${request.userId}`}
          required
          minLength={5}
          maxLength={2000}
          value={evidence}
          onChange={event => setEvidence(event.target.value)}
        />
        <p className="text-sm">
          Confirm only after reviewing guardian consent for the activities and
          validity period in the displayed waiver version. This does not confirm
          dues or reserve a seat.
        </p>
        <Button
          disabled={pending || annualPending || evidence.trim().length < 5}
          type="submit"
        >
          {pending ? 'Saving…' : 'Confirm guardian consent'}
        </Button>
      </form>
      <output>{annualMessage || message}</output>
    </article>
  )
}
