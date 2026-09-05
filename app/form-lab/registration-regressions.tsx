'use client'
import { AnnualProfile } from '@/components/registration/annual-profile'
import { TripCTA } from '@/components/trips/TripCTA'
import { createUnlvWaiver } from '@/lib/registration/unlv-waiver'

export function RegistrationRegressions() {
  const id = '33333333-3333-4333-8333-333333333333'
  const document = {
    id,
    title: 'Outdoor Adventures — 2026–2027',
    version: 1,
    body: createUnlvWaiver(
      'Outdoor adventures',
      'July 1, 2026 – June 30, 2027',
      'Falls and heat illness.',
    ),
    effective_from: '2026-07-01',
    effective_until: '2027-06-30',
    activity_scope: ['hiking'],
    source_url: 'https://www.unlv.edu',
    filled_values: {},
  }
  return (
    <details className="min-w-0 max-w-full">
      <summary>Registration regression examples</summary>
      <div className="min-w-0 space-y-4" data-testid="registration-regressions">
        <TripCTA
          trip={{
            id,
            status: 'open',
            registrationState: 'confirmed',
            registrationActionRequired: false,
          }}
        />
        <TripCTA
          trip={{
            id,
            status: 'open',
            registrationState: 'confirmed',
            registrationActionRequired: true,
          }}
        />
        <AnnualProfile
          state={{
            current: document,
            signatureId: id,
            upcomingRegistrations: 1,
            ageAdult: true,
            emergencyContact: {
              name: 'Test Friend',
              phone: '7025550100',
              relationship: 'Friend',
              notes: '',
            },
            history: [
              {
                ...document,
                signatureId: id,
                signedAt: '2026-09-05T12:00:00Z',
                signatureName: 'Test Participant',
                signerKind: 'adult',
                guardianSignedOn: null,
                withdrawnAt: null,
                validFrom: '2026-07-01',
                validUntil: '2027-06-30',
              },
            ],
          }}
        />
      </div>
    </details>
  )
}
