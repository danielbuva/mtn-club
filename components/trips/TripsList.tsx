'use client'

import { LayoutGrid, Rows3 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { TripCard } from '@/components/trips/TripCard'
import { Button } from '@/components/ui/button'
import { useIsMobile } from '@/hooks/use-mobile'
import type { TripListItem } from '@/lib/trips/types'

type ViewMode = 'grid' | 'list'

type TripsListProps = {
  trips: TripListItem[]
}

export function TripsList({ trips }: TripsListProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const isMobile = useIsMobile()
  const effectiveViewMode: ViewMode = isMobile ? 'list' : viewMode

  const sortedTrips = useMemo(
    () => [...trips].sort((a, b) => a.startAt.getTime() - b.startAt.getTime()),
    [trips],
  )

  return (
    <section className="space-y-4">
      <div className="hidden items-center justify-start gap-2 md:flex">
        <Button
          type="button"
          size="sm"
          variant={viewMode === 'grid' ? 'default' : 'outline'}
          onClick={() => setViewMode('grid')}
        >
          <LayoutGrid className="h-4 w-4" />
          Grid
        </Button>
        <Button
          type="button"
          size="sm"
          variant={viewMode === 'list' ? 'default' : 'outline'}
          onClick={() => setViewMode('list')}
        >
          <Rows3 className="h-4 w-4" />
          List
        </Button>
      </div>

      <div
        className={
          effectiveViewMode === 'grid'
            ? 'grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3'
            : 'grid grid-cols-1 gap-4'
        }
      >
        {sortedTrips.map(trip => (
          <TripCard key={trip.id} trip={trip} viewMode={effectiveViewMode} />
        ))}
      </div>
    </section>
  )
}
