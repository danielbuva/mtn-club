'use client'

import { Suspense } from 'react'
import { TripDetailEditor } from '@/components/trips/detail/TripDetailEditor'
import type { RegistrationRoster } from '@/lib/registration/schema'
import { registrationFixture } from './fixtures'

const roster: RegistrationRoster = {
  snapshot: {
    ...registrationFixture,
    title: 'Registration settings regression',
    canManage: true,
    annualWaiver: false,
    waiver: null,
    availability: 'disabled',
  },
  settings: {
    enabled: false,
    eligibility: 'members',
    collect_transportation: true,
    emergency_required: true,
    waiver_required: true,
    questions: [],
    revision: 1,
    offer_hours: 24,
    locked_at: null,
  },
  trip: {
    capacity: null,
    waitlistEnabled: true,
    deadline: null,
    isAllDay: true,
  },
  rows: [],
}

export function RegistrationSettingsRegression() {
  return (
    <details>
      <summary>Trip registration settings regression</summary>
      <p>Example only. No saved trip is attached to this editor.</p>
      <Suspense fallback={<p>Loading registration editor…</p>}>
        <TripDetailEditor
          registrationRoster={roster}
          availableActivityTags={['hiking']}
          trip={{
            id: registrationFixture.tripId,
            title: roster.snapshot.title,
            activityType: 'hiking',
            activityTags: ['hiking'],
            locationName: 'Example location',
            startAt: new Date(registrationFixture.startAt),
            isAllDay: true,
            status: 'closed',
          }}
        />
      </Suspense>
    </details>
  )
}
