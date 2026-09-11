'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { FormActions } from '@/components/forms/form-actions'
import {
  FormMessage,
  FormProgress,
  FormShell,
  FormStep,
} from '@/components/forms/form-shell'
import { FormViewport } from '@/components/forms/form-viewport'
import { saveInformedRisksAction } from '@/lib/registration/annual-actions'
import {
  additionalRiskStatements,
  riskStatements,
} from '@/lib/registration/risk-activities'
import type { TripRegistrationSnapshot } from '@/lib/registration/schema'
import { InformedRiskFields } from './informed-risk-fields'

export { InformedRiskFields } from './informed-risk-fields'
export function InformedRiskEditor({
  snapshot,
  initiallyOpen = false,
}: {
  snapshot: TripRegistrationSnapshot
  initiallyOpen?: boolean
}) {
  const [risks, setRisks] = useState(
    additionalRiskStatements(
      snapshot.informedRisks?.activities ?? [],
      snapshot.informedRisks?.statements ?? [],
    ),
  )
  const [activities, setActivities] = useState(
    snapshot.informedRisks?.activities ?? [],
  )
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()
  return (
    <details open={initiallyOpen} className="rounded-lg border p-4">
      <summary className="cursor-pointer font-semibold">Informed risks</summary>
      <FormShell
        className="mt-4"
        onSubmit={async event => {
          event.preventDefault()
          if (pending) return
          setPending(true)
          try {
            const result = await saveInformedRisksAction(
              snapshot.tripId,
              snapshot.informedRisks?.revision ?? 0,
              riskStatements(activities, risks),
              activities,
            )
            setMessage(result.message)
            if (result.ok) router.refresh()
          } catch {
            setMessage('Check the activities and add 1–5 risk statements.')
          } finally {
            setPending(false)
          }
        }}
      >
        <FormProgress index={0} count={1} />
        <FormMessage>{message}</FormMessage>
        <FormViewport stepId="informed-risks" direction={1}>
          <FormStep title="Informed risks">
            <InformedRiskFields
              risks={risks}
              activities={activities}
              onRisks={setRisks}
              onActivities={setActivities}
            />
            {snapshot.informedRisks && (
              <p className="mt-4 text-sm">
                Editing the wording or activities creates a new revision.
                Existing registrations keep their places and require renewed
                acknowledgement. Whitespace-only edits do not create a revision.
              </p>
            )}
          </FormStep>
        </FormViewport>
        <FormActions pending={pending} primaryLabel="Save informed risks" />
      </FormShell>
    </details>
  )
}
