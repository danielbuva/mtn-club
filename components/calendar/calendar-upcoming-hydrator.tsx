'use client'

import { useEffect } from 'react'
import { useCalendarTrips } from '@/components/calendar/calendar-trips-provider'
import type { CalendarTrip } from '@/lib/events/types'

type CalendarUpcomingHydratorProps = {
  trips: CalendarTrip[]
}

export function CalendarUpcomingHydrator({
  trips,
}: CalendarUpcomingHydratorProps) {
  const { mergeTrips } = useCalendarTrips()

  useEffect(() => {
    mergeTrips(trips)
  }, [mergeTrips, trips])

  return null
}
