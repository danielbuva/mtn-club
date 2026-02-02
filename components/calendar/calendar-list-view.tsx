'use client'

import { format } from 'date-fns'
import { Lock } from 'lucide-react'
import { useMemo } from 'react'
import {
  getSemesterRange,
  isTripInRange,
  type SemesterKey,
} from '@/components/calendar/calendar-utils'
import { TripListItem } from '@/components/calendar/trip-list-item'
import { MemberCTA } from '@/components/member-cta'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { ViewerKey } from '@/lib/events/calendar'
import type { CalendarTrip } from '@/lib/events/types'

interface CalendarListViewProps {
  trips: CalendarTrip[]
  semester: SemesterKey
  year: number
  viewerKey: ViewerKey
  onTripSelect: (trip: CalendarTrip) => void
  focusDate?: string | null
  onClearFocus?: () => void
}

export function CalendarListView({
  trips,
  semester,
  year,
  viewerKey,
  onTripSelect,
  focusDate,
  onClearFocus,
}: CalendarListViewProps) {
  const visibleTrips = useMemo(() => {
    const range = getSemesterRange(year, semester)
    const focusDay = focusDate ? new Date(focusDate) : null
    const focusRange = focusDay ? { start: focusDay, end: focusDay } : null

    const filteredTrips = range
      ? trips.filter(trip => isTripInRange(trip, range))
      : trips

    const tripsInRange = focusRange
      ? filteredTrips.filter(trip => isTripInRange(trip, focusRange))
      : filteredTrips

    return [...tripsInRange].sort(
      (a, b) =>
        new Date(a.dateStart).getTime() - new Date(b.dateStart).getTime(),
    )
  }, [focusDate, semester, trips, year])

  const isPublic = viewerKey === 'public'

  if (visibleTrips.length === 0 && !isPublic) {
    return (
      <Card className="p-12 text-center">
        <p className="text-muted-foreground">No trips match your filters.</p>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {focusDate && onClearFocus && (
        <Card className="border-border/60 bg-card p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                Day
              </p>
              <p className="text-sm font-semibold">
                {format(new Date(focusDate), 'EEEE, MMM d')}
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClearFocus}
            >
              View full list
            </Button>
          </div>
        </Card>
      )}
      {visibleTrips.map(trip => (
        <TripListItem
          key={`trip-${trip.id}`}
          trip={trip}
          onClick={() => onTripSelect(trip)}
        />
      ))}
      {isPublic && <LockedTripsBlock />}
    </div>
  )
}

function LockedTripsBlock() {
  const lockedTripKeys = ['locked-1', 'locked-2', 'locked-3']

  return (
    <Card className="relative overflow-hidden border-primary/20 bg-primary/5">
      <CardContent className="p-6">
        <div className="relative">
          <div className="space-y-3 blur-[1.5px] grayscale opacity-70">
            {lockedTripKeys.map(key => (
              <div
                key={key}
                className="flex items-center gap-4 rounded-xl border border-border/60 bg-card px-4 py-3"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
                  <span className="text-xs font-semibold">Trip</span>
                </div>
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-40 rounded-full bg-muted-foreground/30" />
                  <div className="h-3 w-56 rounded-full bg-muted-foreground/20" />
                </div>
                <div className="h-6 w-16 rounded-full bg-muted-foreground/20" />
              </div>
            ))}
          </div>
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="pointer-events-auto flex flex-col items-center gap-3 rounded-2xl border border-primary/20 bg-background/95 px-6 py-4 text-center shadow-lg">
              <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                <Lock className="h-4 w-4" />
                Upcoming trips are hidden for non-members
              </div>
              <p className="text-xs text-muted-foreground">
                Join the club to unlock full trip details and RSVP.
              </p>
              <MemberCTA size="sm" className="rounded-full" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
