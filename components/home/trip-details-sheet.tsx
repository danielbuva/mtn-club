'use client'

import { TripDetailsDrawer } from '@/components/trip-details-drawer'
import type { CalendarTrip } from '@/lib/events/types'

type TripDetailsSheetProps = {
  trip: CalendarTrip | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TripDetailsSheet({
  trip,
  open,
  onOpenChange,
}: TripDetailsSheetProps) {
  return (
    <TripDetailsDrawer trip={trip} open={open} onOpenChange={onOpenChange} />
  )
}
