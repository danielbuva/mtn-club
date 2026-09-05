'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { saveRegistrationSettingsAction } from '@/lib/registration/actions'
import type {
  RegistrationRoster,
  RegistrationSettingsInput,
} from '@/lib/registration/schema'
import { QuestionEditor } from './question-editor'
import { WaiverTemplatePicker } from './waiver-template-picker'

export function SettingsEditor({ roster }: { roster: RegistrationRoster }) {
  const { settings, snapshot, trip } = roster
  const [values, setValues] = useState<RegistrationSettingsInput>({
    enabled: settings.enabled,
    eligibility: settings.eligibility,
    emergencyRequired: settings.emergency_required,
    waiverRequired: settings.waiver_required,
    questions: settings.questions,
    capacity: trip.capacity,
    waitlistEnabled: trip.waitlistEnabled,
    deadline: trip.deadline,
    offerHours: settings.offer_hours,
  })
  const [message, setMessage] = useState('')
  const [pending, startTransition] = useTransition()
  const router = useRouter()
  const locked = settings.locked_at !== null
  const update = (next: Partial<RegistrationSettingsInput>) =>
    setValues(current => ({ ...current, ...next }))
  return (
    <details className="rounded-lg border p-4">
      <summary className="cursor-pointer font-semibold">
        Registration settings
      </summary>
      <form
        className="mt-4 space-y-4"
        onSubmit={event => {
          event.preventDefault()
          startTransition(async () => {
            try {
              const result = await saveRegistrationSettingsAction(
                snapshot.tripId,
                settings.revision,
                values,
              )
              setMessage(result.message)
              if (result.ok) router.refresh()
            } catch {
              setMessage('Settings could not be saved. Refresh and try again.')
            }
          })
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="registration-status">Registration</Label>
          <select
            id="registration-status"
            className="w-full rounded border bg-background p-2"
            value={values.enabled ? 'open' : 'closed'}
            onChange={event =>
              update({ enabled: event.target.value === 'open' })
            }
          >
            <option value="closed">Closed</option>
            <option value="open">Open</option>
          </select>
        </div>
        <p className="text-sm text-muted-foreground">
          The global registration switch must also be enabled. Outstanding valid
          offers can still be accepted while new registrations are paused.
        </p>
        <div className="space-y-2">
          <Label htmlFor="capacity">Seat limit (empty means unlimited)</Label>
          <Input
            id="capacity"
            type="number"
            min={1}
            value={values.capacity ?? ''}
            onChange={event =>
              update({
                capacity: event.target.value
                  ? Number(event.target.value)
                  : null,
              })
            }
          />
        </div>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={values.waitlistEnabled}
            onChange={event =>
              update({ waitlistEnabled: event.target.checked })
            }
          />
          Allow new waitlist requests
        </label>
        <div className="space-y-2">
          <Label htmlFor="deadline">
            Registration closes (UTC; empty means trip start)
          </Label>
          <Input
            id="deadline"
            type="datetime-local"
            required={trip.isAllDay && values.enabled}
            value={
              values.deadline
                ? new Date(values.deadline).toISOString().slice(0, 16)
                : ''
            }
            onChange={event =>
              update({
                deadline: event.target.value
                  ? new Date(`${event.target.value}:00Z`).toISOString()
                  : null,
              })
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="offer-hours">Offer duration in hours</Label>
          <Input
            id="offer-hours"
            type="number"
            min={1}
            max={168}
            required
            value={values.offerHours}
            onChange={event =>
              update({ offerHours: Number(event.target.value) })
            }
          />
        </div>
        {locked ? (
          <p className="text-sm">
            Eligibility, questions, and waiver requirements are frozen because
            registration history exists.
          </p>
        ) : null}
        <fieldset disabled={locked} className="space-y-4">
          <legend className="font-semibold">Participant requirements</legend>
          <Label htmlFor="eligibility">Who can register?</Label>
          <select
            id="eligibility"
            className="w-full rounded border bg-background p-2"
            value={values.eligibility}
            onChange={event =>
              update({
                eligibility:
                  event.target.value === 'account' ? 'account' : 'members',
              })
            }
          >
            <option value="members">Active members</option>
            <option value="account">Any signed-in account</option>
          </select>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={values.emergencyRequired}
              onChange={event =>
                update({ emergencyRequired: event.target.checked })
              }
            />
            Require emergency contact
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={values.waiverRequired}
              onChange={event =>
                update({ waiverRequired: event.target.checked })
              }
            />
            Require signed waiver
          </label>
          {snapshot.waiver ? (
            <p className="text-sm">
              Current waiver: {snapshot.waiver.title}, version{' '}
              {snapshot.waiver.version}.
            </p>
          ) : null}
          <WaiverTemplatePicker snapshot={snapshot} onChange={update} />
          <Label htmlFor="waiver-title">New waiver title</Label>
          <Input
            id="waiver-title"
            value={values.waiverTitle ?? ''}
            onChange={event => update({ waiverTitle: event.target.value })}
          />
          <Label htmlFor="waiver-body">
            Club-approved waiver text (leave empty to keep current version)
          </Label>
          <Textarea
            id="waiver-body"
            rows={8}
            value={values.waiverBody ?? ''}
            onChange={event => update({ waiverBody: event.target.value })}
          />
        </fieldset>
        <QuestionEditor
          disabled={locked}
          questions={values.questions}
          onChange={questions => update({ questions })}
        />
        <Button disabled={pending} type="submit">
          {pending ? 'Saving…' : 'Save settings'}
        </Button>
        <output>{message}</output>
      </form>
    </details>
  )
}
