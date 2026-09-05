'use client'

import { useState } from 'react'
import { TripCTA } from '@/components/trips/TripCTA'
import { TripBottomControls } from '@/components/trips/trip-bottom-controls'
import type { TripDetail } from '@/lib/trips/types'

type TripStickyRsvpBarProps = {
  trip: Pick<
    TripDetail,
    'id' | 'status' | 'registrationState' | 'registrationActionRequired'
  >
  viewer: {
    isAuthenticated: boolean
    isMember: boolean
  }
}

export function TripStickyRsvpBar({ trip }: TripStickyRsvpBarProps) {
  const [expanded, setExpanded] = useState(false)
  const choicesExpanded =
    expanded &&
    !['closed', 'full', 'cancelled'].includes(trip.status) &&
    (!trip.registrationState ||
      ['none', 'maybe', 'cancelled'].includes(trip.registrationState))
  return (
    <TripBottomControls
      fallbackHref="/trips"
      showBack={!choicesExpanded}
      showNavigation={!choicesExpanded}
    >
      {trip.status === 'cancelled' ? (
        <span className="px-4 text-sm font-semibold">Trip canceled</span>
      ) : (
        <TripCTA
          trip={trip}
          className="rounded-full px-4 text-xs whitespace-nowrap"
          expandable
          onExpandedChange={setExpanded}
        />
      )}
    </TripBottomControls>
  )
}
