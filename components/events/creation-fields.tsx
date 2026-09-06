'use client'

import { ChoiceCards } from '@/components/forms/choice-cards'
import {
  DateTimeField,
  TextAreaField,
  TextField,
  ToggleField,
} from '@/components/forms/fields'
import {
  EVENT_DIFFICULTIES,
  EVENT_KINDS,
  EVENT_VISIBILITIES,
} from '@/lib/events/constants'
import type { EventFormValues } from '@/lib/events/schema'

export type CreationFieldsProps = {
  values: EventFormValues
  errors: Record<string, string>
  canChooseOfficial: boolean
  onChange: <K extends keyof EventFormValues>(
    key: K,
    value: EventFormValues[K],
  ) => void
}
export function CreationBasics({
  values,
  errors,
  onChange,
  canChooseOfficial,
}: CreationFieldsProps) {
  return (
    <div className="space-y-6">
      {canChooseOfficial && (
        <ToggleField
          label="Official club trip"
          hint="Turn off for a community meetup."
          checked={values.isOfficial}
          onChange={value => onChange('isOfficial', value)}
        />
      )}
      <TextField
        id="title"
        label="Trip title"
        value={values.title}
        error={errors.title}
        required
        onChange={event => onChange('title', event.target.value)}
        placeholder="A sunrise worth getting up for"
      />
      <div className="space-y-2">
        <label htmlFor="kind" className="text-sm font-medium">
          Type
        </label>
        <select
          id="kind"
          className="min-h-12 w-full border border-foreground/20 bg-background px-3"
          value={values.kind}
          onChange={event => {
            const kind = EVENT_KINDS.find(value => value === event.target.value)
            if (kind) onChange('kind', kind)
          }}
        >
          {EVENT_KINDS.map(kind => (
            <option key={kind} value={kind}>
              {kind.charAt(0).toUpperCase() + kind.slice(1)}
            </option>
          ))}
        </select>
      </div>
      <TextAreaField
        label="Short summary"
        optional
        value={values.shortSummary ?? ''}
        error={errors.shortSummary}
        maxLength={4000}
        onChange={event => onChange('shortSummary', event.target.value)}
      />
    </div>
  )
}
export function CreationPlace({
  values,
  errors,
  onChange,
}: CreationFieldsProps) {
  return (
    <div className="space-y-6">
      <div className="grid gap-5 md:grid-cols-2">
        <DateTimeField
          id="startAt"
          label="Start"
          required
          value={values.startAt}
          error={errors.startAt}
          onChange={event => onChange('startAt', event.target.value)}
        />
        <DateTimeField
          id="endAt"
          label="End"
          required
          value={values.endAt}
          error={errors.endAt}
          onChange={event => onChange('endAt', event.target.value)}
        />
      </div>
      <TextField
        id="timezone"
        label="Timezone"
        value={values.timezone}
        error={errors.timezone}
        hint="For example, America/Los_Angeles"
        onChange={event => onChange('timezone', event.target.value)}
      />
      <div className="grid gap-5 md:grid-cols-2">
        <TextField
          id="primaryLocationName"
          label="Destination"
          required
          value={values.primaryLocationName}
          error={errors.primaryLocationName}
          onChange={event =>
            onChange('primaryLocationName', event.target.value)
          }
        />
        <TextField
          label="Meeting point"
          optional
          value={values.meetingLocationName ?? ''}
          onChange={event =>
            onChange('meetingLocationName', event.target.value)
          }
        />
      </div>
      <TextAreaField
        label="Private meeting instructions"
        optional
        value={values.locationNotes ?? ''}
        onChange={event => onChange('locationNotes', event.target.value)}
      />
    </div>
  )
}
const details = [
  ['overviewWhat', 'What to expect'],
  ['overviewWhere', 'Route and area'],
  ['overviewWeather', 'Weather and preparation'],
  ['overviewEquipment', 'Equipment to bring'],
  ['overviewCarpoolNeedGear', 'Transportation and gear notes'],
] as const
export function CreationDetails({ values, onChange }: CreationFieldsProps) {
  return (
    <div className="space-y-7">
      <ChoiceCards
        label="Difficulty (optional)"
        columns
        options={EVENT_DIFFICULTIES.map(value => ({
          value,
          label: value,
          description: value === 'Easy' ? 'Beginner friendly' : undefined,
        }))}
        value={values.difficulty ?? null}
        onChange={value => onChange('difficulty', value)}
      />
      <button
        type="button"
        className="min-h-11 text-sm underline"
        onClick={() => onChange('difficulty', undefined)}
      >
        Clear difficulty
      </button>
      <div className="grid gap-5 md:grid-cols-2">
        {details.map(([key, label]) => (
          <TextAreaField
            key={key}
            label={label}
            optional
            value={values[key] ?? ''}
            onChange={event => onChange(key, event.target.value)}
          />
        ))}
      </div>
    </div>
  )
}
export function CreationSettings({
  values,
  errors,
  onChange,
  canChooseOfficial,
  noLimit,
  onNoLimit,
}: CreationFieldsProps & {
  noLimit: boolean
  onNoLimit: (value: boolean) => void
}) {
  return (
    <div className="space-y-6">
      <ChoiceCards
        label="Who can see this trip?"
        value={values.visibility}
        options={EVENT_VISIBILITIES.filter(
          value => canChooseOfficial || value !== 'leaders_only',
        ).map(value => ({
          value,
          label: {
            public: 'Everyone',
            members: 'Club members',
            leaders_only: 'Leaders only',
          }[value],
        }))}
        onChange={value => onChange('visibility', value)}
      />
      <ToggleField
        label="No participant limit"
        checked={noLimit}
        onChange={onNoLimit}
      />
      {!noLimit && (
        <TextField
          id="maxParticipants"
          label="Participant limit"
          type="number"
          inputMode="numeric"
          min={1}
          max={100000}
          value={values.maxParticipants ?? ''}
          error={errors.maxParticipants}
          onChange={event => onChange('maxParticipants', event.target.value)}
        />
      )}
      <ToggleField
        label="Ask about transportation"
        hint="Optionally collect ride needs and passenger seats offered. This does not match riders with drivers."
        checked={values.collectTransportation}
        onChange={value => onChange('collectTransportation', value)}
      />
    </div>
  )
}
