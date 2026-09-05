'use client'

import { useState } from 'react'
import { ChoiceCards } from '@/components/forms/choice-cards'
import {
  DateTimeField,
  NumberStepper,
  TextAreaField,
  TextField,
  ToggleField,
} from '@/components/forms/fields'
import { FormStep } from '@/components/forms/form-shell'

export function FieldGallery() {
  const [place, setPlace] = useState<string | null>(null)
  const [gear, setGear] = useState<string[]>([])
  const [seats, setSeats] = useState(3)
  const [enabled, setEnabled] = useState(true)
  return (
    <div data-guided-form className="mx-auto max-w-2xl space-y-16">
      <FormStep
        title="Small decisions. Room to breathe."
        description="A few of the building blocks, in their natural habitat."
      >
        <ChoiceCards
          label="Where should we meet?"
          value={place}
          onChange={setPlace}
          options={[
            {
              value: 'campus',
              label: 'On campus',
              description: 'Start the morning together.',
            },
            {
              value: 'trailhead',
              label: 'At the trailhead',
              description: 'I’ll meet everyone there.',
            },
          ]}
        />
      </FormStep>
      <ChoiceCards
        label="What are you bringing?"
        multiple
        columns
        value={gear}
        onChange={setGear}
        options={[
          { value: 'water', label: 'Water' },
          { value: 'snacks', label: 'Trail snacks' },
        ]}
      />
      <NumberStepper
        label="Passenger seats"
        value={seats}
        onChange={setSeats}
      />
      <ToggleField
        label="Share transportation preferences"
        checked={enabled}
        onChange={setEnabled}
      />
      <TextField label="Your name" placeholder="First and last name" />
      <DateTimeField label="Meetup time" />
      <TextAreaField
        label="Anything else?"
        optional
        hint="A little context goes a long way."
      />
    </div>
  )
}
