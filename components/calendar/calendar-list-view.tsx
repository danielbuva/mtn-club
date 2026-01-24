'use client'

import { useMemo } from 'react'
import { format } from 'date-fns'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TripListItem } from '@/components/calendar/trip-list-item'
import { TeaserListItem } from '@/components/calendar/teaser-list-item'
import { getSemesterRange, isTripInRange, type SemesterKey } from '@/components/calendar/calendar-utils'
import type { CalendarTrip, TripTeaserDay } from '@/lib/events/types'
import type { ViewerKey } from '@/lib/events/calendar'

interface CalendarListViewProps {
  trips: CalendarTrip[]
  teasers: TripTeaserDay[]
  semester: SemesterKey
  year: number
  viewerKey: ViewerKey
  onTripSelect: (trip: CalendarTrip) => void
  onTeaserClick: (day: string, teaser: TripTeaserDay) => void
  focusDate?: string | null
  onClearFocus?: () => void
}

type ListItem =
  | { kind: 'trip'; date: string; trip: CalendarTrip }
  | { kind: 'teaser'; date: string; teaser: TripTeaserDay }

export function CalendarListView({
  trips,
  teasers,
  semester,
  year,
  viewerKey,
  onTripSelect,
  onTeaserClick,
  focusDate,
  onClearFocus,
}: CalendarListViewProps) {
  const items = useMemo(() => {
    const range = getSemesterRange(year, semester)
    const focusDay = focusDate ? new Date(focusDate) : null
    const focusRange = focusDay ? { start: focusDay, end: focusDay } : null
    const itemsList: ListItem[] = []

    let filteredTrips = range
      ? trips.filter((trip) => isTripInRange(trip, range))
      : trips

    if (focusRange) {
      filteredTrips = filteredTrips.filter((trip) => isTripInRange(trip, focusRange))
    }

    filteredTrips.forEach((trip) => {
      itemsList.push({ kind: 'trip', date: trip.dateStart, trip })
    })

    if (viewerKey === 'public') {
      const upcomingTeasers = teasers.filter((teaser) => {
        const date = new Date(teaser.day)
        const isUpcoming = date >= new Date()
        if (!isUpcoming || teaser.event_count <= 0) return false
        if (focusRange && teaser.day !== focusDate) return false
        if (range) {
          return date >= range.start && date <= range.end
        }
        return true
      })

      upcomingTeasers.forEach((teaser) => {
        itemsList.push({ kind: 'teaser', date: teaser.day, teaser })
      })
    }

    return itemsList.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    )
  }, [focusDate, semester, teasers, trips, viewerKey, year])

  if (items.length === 0) {
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
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Day</p>
              <p className="text-sm font-semibold">
                {format(new Date(focusDate), 'EEEE, MMM d')}
              </p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={onClearFocus}>
              View full list
            </Button>
          </div>
        </Card>
      )}
      {items.map((item) =>
        item.kind === 'trip' ? (
          <TripListItem
            key={`trip-${item.trip.id}`}
            trip={item.trip}
            onClick={() => onTripSelect(item.trip)}
          />
        ) : (
          <TeaserListItem
            key={`teaser-${item.teaser.day}`}
            teaser={item.teaser}
            onClick={() => onTeaserClick(item.teaser.day, item.teaser)}
          />
        )
      )}
    </div>
  )
}
