'use client'

import { format } from 'date-fns'
import { useMemo } from 'react'
import {
  getSemesterRange,
  isTripInRange,
  type SemesterKey,
} from '@/components/calendar/calendar-utils'
import { TripListItem } from '@/components/calendar/trip-list-item'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { parseCalendarDate } from '@/lib/events/formatters'
import type { CalendarTrip } from '@/lib/events/types'

interface CalendarListViewProps {
  trips: CalendarTrip[]
  semester: SemesterKey
  year: number
  onTripSelect: (trip: CalendarTrip) => void
  focusDate?: string | null
  onClearFocus?: () => void
}

export function CalendarListView({
  trips,
  semester,
  year,
  onTripSelect,
  focusDate,
  onClearFocus,
}: CalendarListViewProps) {
  const visibleTrips = useMemo(() => {
    const range = getSemesterRange(year, semester)
    const focusDay = focusDate ? parseCalendarDate(focusDate) : null
    const focusRange = focusDay ? { start: focusDay, end: focusDay } : null

    const filteredTrips = range
      ? trips.filter(trip => isTripInRange(trip, range))
      : trips

    const tripsInRange = focusRange
      ? filteredTrips.filter(trip => isTripInRange(trip, focusRange))
      : filteredTrips

    return [...tripsInRange].sort(
      (a, b) =>
        parseCalendarDate(a.dateStart).getTime() -
        parseCalendarDate(b.dateStart).getTime(),
    )
  }, [focusDate, semester, trips, year])

  if (visibleTrips.length === 0) {
    return (
      <Card className="rounded-none p-12 text-center">
        <p className="text-muted-foreground">No trips match your filters.</p>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {focusDate && onClearFocus && (
        <Card className="rounded-none border-border/60 bg-card p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                Day
              </p>
              <p className="text-sm font-semibold">
                {format(parseCalendarDate(focusDate), 'EEEE, MMM d')}
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
    </div>
  )
}
