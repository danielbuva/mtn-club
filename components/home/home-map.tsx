'use client'

import { MapShell } from '@/components/map-shell'
import type { CalendarTrip } from '@/lib/events/types'

type HomeMapProps = {
  trips: CalendarTrip[]
  selectedTripId?: string
  onTripSelect: (trip: CalendarTrip) => void
}

export function HomeMap({ trips, selectedTripId, onTripSelect }: HomeMapProps) {
  return (
    <div className="absolute inset-0">
      <MapShell trips={trips} onTripSelect={onTripSelect} selectedTripId={selectedTripId} />
    </div>
  )
}
