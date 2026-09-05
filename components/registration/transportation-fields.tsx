'use client'

import { Car, Check, Hand } from 'lucide-react'
import { ChoiceCards } from '@/components/forms/choice-cards'
import type { RegistrationValues } from '@/lib/registration/form-values'

export function TransportationFields({
  value,
  onChange,
}: {
  value: RegistrationValues['transportationMode']
  onChange: (
    value: NonNullable<RegistrationValues['transportationMode']>,
  ) => void
}) {
  return (
    <ChoiceCards
      hideLabel
      label="Your transportation"
      value={value}
      onChange={onChange}
      options={[
        {
          value: 'driver',
          label: 'I can drive',
          description: 'I can bring other people.',
          icon: <Car className="size-7" />,
        },
        {
          value: 'needs_ride',
          label: 'I need a ride',
          icon: <Hand className="size-7" />,
        },
        {
          value: 'self_arranged',
          label: 'I’ve got a ride',
          icon: <Check className="size-7" />,
        },
      ]}
    />
  )
}
