'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { ScrollIndicator } from '@/components/home/scroll-indicator'
import { TripPhotoSheet } from '@/components/home/trip-photo-sheet'
import { tripPoints, type TripPoint } from '@/lib/map/trip-points'
import type { CalendarTrip } from '@/lib/events/types'

const MapView = dynamic(
  () => import('@/components/home/home-map').then((mod) => mod.HomeMap),
  { ssr: false }
)

type HomePageProps = {
  trips: CalendarTrip[]
  tripsError: string | null
  showScrollIndicator: boolean
  scrollTargetId: string
}

export function HomePageClient({
  tripsError,
  showScrollIndicator,
  scrollTargetId,
}: HomePageProps) {
  const [selectedTrip, setSelectedTrip] = useState<TripPoint | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)

  const handleTripSelect = (trip: TripPoint) => {
    setSelectedTrip(trip)
    setDetailsOpen(true)
  }

  return (
    <>
      <section className="relative h-screen w-full overflow-hidden">
        <MapView onTripSelect={handleTripSelect} selectedTripId={selectedTrip?.id} />

        <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-background/10 via-transparent to-background/50" />

        {showScrollIndicator ? (
          <div
            className="absolute left-1/2 -translate-x-1/2 z-10"
            style={{ bottom: 'max(6.5rem, calc(env(safe-area-inset-bottom) + 5.5rem))' }}
          >
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
        ) : tripPoints.length === 0 ? (
          <div className="absolute left-1/2 top-6 -translate-x-1/2 z-10 rounded-full border border-border bg-background/90 px-4 py-2 text-xs text-muted-foreground shadow-sm backdrop-blur">
            No trips are available yet. Check back soon.
          </div>
        ) : null}
      </section>

      <TripPhotoSheet
        trip={selectedTrip}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
      />
    </>
  )
}
