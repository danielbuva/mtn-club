'use client'

import type { Dispatch, SetStateAction } from 'react'
import { Input } from '@/components/ui/input'
import type { RegistrationInput } from '@/lib/registration/schema'
import { WaiverFieldError } from './waiver-field-error'

type SignerDetails = NonNullable<RegistrationInput['data']['signerDetails']>
export function SignerContactFields({
  details,
  onDetails,
  errors,
}: {
  details: SignerDetails
  onDetails: Dispatch<SetStateAction<SignerDetails>>
  errors: Record<string, string>
}) {
  return (
    <>
      {' '}
      {(['phone', 'address', 'emergencyAddress', 'birthDate'] as const).map(
        key => (
          <label className="block text-sm" key={key} htmlFor={`waiver-${key}`}>
            {
              {
                phone: 'Your phone number',
                address: 'Your local address',
                emergencyAddress: 'Emergency contact address',
                birthDate: 'Your date of birth',
              }[key]
            }
            <Input
              required
              id={`waiver-${key}`}
              aria-describedby={`waiver-${key}-error`}
              name={`signerDetails.${key}`}
              autoComplete={
                {
                  phone: 'section-member tel',
                  address: 'section-member street-address',
                  emergencyAddress: 'section-emergency street-address',
                  birthDate: 'section-member bday',
                }[key]
              }
              type={
                key === 'birthDate' ? 'date' : key === 'phone' ? 'tel' : 'text'
              }
              aria-invalid={Boolean(errors[`signerDetails.${key}`])}
              maxLength={key === 'phone' ? 50 : 500}
              value={details[key]}
              onInput={e => {
                const value = e.currentTarget.value
                onDetails(previous => ({ ...previous, [key]: value }))
              }}
              onChange={e => {
                const value = e.currentTarget.value
                onDetails(previous => ({ ...previous, [key]: value }))
              }}
              onBlur={e => {
                const value = e.currentTarget.value
                onDetails(previous => ({ ...previous, [key]: value }))
              }}
            />
            <WaiverFieldError
              id={`waiver-${key}-error`}
              error={errors[`signerDetails.${key}`]}
            />
          </label>
        ),
      )}
    </>
  )
}
