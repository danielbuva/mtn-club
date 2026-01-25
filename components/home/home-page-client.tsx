'use client'

import { useMemo, useState } from 'react'
import { HomeMap } from '@/components/home/home-map'
import { ScrollIndicator } from '@/components/home/scroll-indicator'
import { TripDetailsSheet } from '@/components/home/trip-details-sheet'
import type { CalendarTrip } from '@/lib/events/types'

type HomePageProps = {
  trips: CalendarTrip[]
  tripsError: string | null
  showScrollIndicator: boolean
  scrollTargetId: string
}

export function HomePageClient({
  trips,
  tripsError,
  showScrollIndicator,
  scrollTargetId,
}: HomePageProps) {
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)

  const selectedTrip = useMemo(
    () => trips.find((trip) => trip.id === selectedTripId) ?? null,
    [selectedTripId, trips]
  )

  const handleTripSelect = (trip: CalendarTrip) => {
    setSelectedTripId(trip.id)
    setDetailsOpen(true)
  }

  return (
    <>
      <section className="relative h-screen w-full overflow-hidden">
        <HomeMap
          trips={trips}
          onTripSelect={handleTripSelect}
          selectedTripId={selectedTrip?.id}
        />

        <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-background/10 via-transparent to-background/50" />

        {showScrollIndicator ? (
          <div className="absolute left-1/2 bottom-6 -translate-x-1/2 z-10">
            <ScrollIndicator
              onClick={() => {
                const target = document.getElementById(scrollTargetId)
                target?.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }}
            />
          </div>
        ) : null}

        {tripsError ? (
          <div className="absolute left-1/2 top-6 -translate-x-1/2 z-10 rounded-full border border-border bg-background/90 px-4 py-2 text-xs text-muted-foreground shadow-sm backdrop-blur">
            {tripsError}. Showing the map with limited data.
          </div>
        ) : trips.length === 0 ? (
          <div className="absolute left-1/2 top-6 -translate-x-1/2 z-10 rounded-full border border-border bg-background/90 px-4 py-2 text-xs text-muted-foreground shadow-sm backdrop-blur">
            No trips are scheduled yet. Check back soon.
          </div>
        ) : null}
      </section>

      <TripDetailsSheet
        trip={selectedTrip}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
      />
    </>
  )
}
