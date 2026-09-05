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
import type { TripRegistrationSnapshot } from '@/lib/registration/schema'
export const waiverActivities = [
  'hiking',
  'backpacking',
  'camping',
  'scrambling',
  'rock climbing',
  'bouldering',
  'transportation/travel',
]
export function InformedRiskFields({
  risks,
  activities,
  onRisks,
  onActivities,
}: {
  risks: string
  activities: string[]
  onRisks: (value: string) => void
  onActivities: (value: string[]) => void
}) {
  return (
    <div className="space-y-4">
      <p>
        Tell participants what is especially important to understand about this
        trip. Keep this specific and useful — they’ll acknowledge it before
        registering.
      </p>
      <label className="block space-y-2">
        <span>Trip-specific risks and conditions</span>
        <textarea
          className="min-h-32 w-full rounded border bg-background p-3"
          value={risks}
          onChange={event => onRisks(event.target.value)}
          maxLength={5000}
        />
      </label>
      <p className="text-sm text-muted-foreground">
        Write roughly 1–3 meaningful statements, one per line. Describe this
        trip’s conditions in plain language. This is separate from the liability
        waiver.
      </p>
      <fieldset className="space-y-2">
        <legend className="mb-2 font-medium">Activities on this trip</legend>
        {[...new Set([...waiverActivities, ...activities])].map(activity => (
          <label key={activity} className="flex min-h-10 items-center gap-3">
            <input
              type="checkbox"
              checked={activities.includes(activity)}
              onChange={event =>
                onActivities(
                  event.target.checked
                    ? [...activities, activity]
                    : activities.filter(value => value !== activity),
                )
              }
            />
            {activity}
          </label>
        ))}
        <label className="block">
          Other activity (requires separate scope review)
          <input
            className="mt-2 w-full rounded border bg-background p-2"
            onBlur={event => {
              const value = event.target.value.trim().toLowerCase()
              if (value && !activities.includes(value))
                onActivities([...activities, value])
              event.target.value = ''
            }}
          />
        </label>
      </fieldset>
    </div>
  )
}
export function InformedRiskEditor({
  snapshot,
  initiallyOpen = false,
}: {
  snapshot: TripRegistrationSnapshot
  initiallyOpen?: boolean
}) {
  const [risks, setRisks] = useState(
    snapshot.informedRisks?.statements.join('\n') ?? '',
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
              risks
                .split('\n')
                .map(x => x.trim())
                .filter(Boolean),
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
